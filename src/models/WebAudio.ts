export default class WebAudio {

    private readonly TARGET_SAMPLE_RATE = 16000;
    private readonly sourceSampleRate: number;


    private bufferUnusedSamples: Float32Array = new Float32Array();

    constructor(sampleRate: number) { 
        this.sourceSampleRate = sampleRate; 
    } 

    /**
     * Downsamples WebAudio to 16 kHz.
     *
     * Browsers can downsample WebAudio natively with OfflineAudioContext's but it was designed for non-streaming use and
     * requires a new context for each AudioBuffer. Firefox can handle this, but chrome (v47) crashes after a few minutes.
     * So, we'll do it in JS for now.
     *
     * This really belongs in it's own stream, but there's no way to create new AudioBuffer instances from JS, so its
     * fairly coupled to the wav conversion code.
     *
     * @param  {AudioBuffer} bufferNewSamples Microphone/MediaElement audio chunk
     * @return {Float32Array} 'audio/l16' chunk
     */
    public downsample(bufferNewSamples: Float32Array): Float32Array {
        let buffer; 
        const newSamples = bufferNewSamples.length;
        const unusedSamples = this.bufferUnusedSamples.length;
        let i;
        let offset;

        if (unusedSamples > 0) {
            buffer = new Float32Array(unusedSamples + newSamples);
            for (i = 0; i < unusedSamples; ++i) {
                buffer[i] = this.bufferUnusedSamples[i];
            }
            for (i = 0; i < newSamples; ++i) {
                buffer[unusedSamples + i] = bufferNewSamples[i];
            }
        } else {
            buffer = bufferNewSamples; 
        }

        // Downsampling and low-pass filter:
        // Input audio is typically 44.1kHz or 48kHz, this downsamples it to 16kHz.
        // It uses a FIR (finite impulse response) Filter to remove (or, at least attinuate)
        // audio frequencies > ~8kHz because sampled audio cannot accurately represent
        // frequiencies greater than half of the sample rate.
        // (Human voice tops out at < 4kHz, so nothing important is lost for transcription.)
        // See http://dsp.stackexchange.com/a/37475/26392 for a good explanation of this code.
        const filter = [
            -0.037935,
            -0.00089024,
            0.040173,
            0.019989,
            0.0047792,
            -0.058675,
            -0.056487,
            -0.0040653,
            0.14527,
            0.26927,
            0.33913,
            0.26927,
            0.14527,
            -0.0040653,
            -0.056487,
            -0.058675,
            0.0047792,
            0.019989,
            0.040173,
            -0.00089024,
            -0.037935
        ];
        const samplingRateRatio = this.sourceSampleRate / this.TARGET_SAMPLE_RATE;
        const nOutputSamples = Math.floor((buffer.length - filter.length) / samplingRateRatio) + 1;
        const outputBuffer = new Float32Array(nOutputSamples);

        for (i = 0; i < outputBuffer.length; i++) {
            offset = Math.round(samplingRateRatio * i);
            let sample = 0;
            for (let j = 0; j < filter.length; ++j) {
                sample += buffer[offset + j] * filter[j];
            }
            outputBuffer[i] = sample;
        }

        const indexSampleAfterLastUsed = Math.round(samplingRateRatio * i);
        const remaining = buffer.length - indexSampleAfterLastUsed;
        if (remaining > 0) {
            this.bufferUnusedSamples = new Float32Array(remaining);
            for (i = 0; i < remaining; ++i) {
                this.bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i];
            }
        } else {
            this.bufferUnusedSamples = new Float32Array(0);
        }

        return outputBuffer;
    };

    /**
     * Accepts a Float32Array of audio data and converts it to a Buffer of l16 audio data (raw wav)
     *
     * Explanation for the math: The raw values captured from the Web Audio API are
     * in 32-bit Floating Point, between -1 and 1 (per the specification).
     * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
     * Filter & combine samples to reduce frequency, then multiply to by 0x7FFF (32767) to convert.
     * Store in little endian.
     *
     * @param {Float32Array} input
     * @return {Buffer}
     */
    public floatTo16BitPCM(input: Float32Array): Buffer {
        const output = new DataView(new ArrayBuffer(input.length * 2)); // length is in bytes (8-bit), so *2 to get 16-bit length
        for (let i = 0; i < input.length; i++) {
            const multiplier = input[i] < 0 ? 0x8000 : 0x7fff; // 16-bit signed range is -32768 to 32767
            output.setInt16(i * 2, (input[i] * multiplier) | 0, true); // index, value ("| 0" = convert to 32-bit int, round towards 0), littleEndian.
        }
        return Buffer.from(output.buffer);
    };

    public encodeWav(samples: Buffer): Buffer {
        const samplesArray = new Uint8Array(samples);

        const buffer = new ArrayBuffer(44 + samplesArray.length);
        const view = new DataView(buffer);

        const writeString = function (offset: number, string: string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        /* RIFF identifier */
        writeString(0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + samplesArray.length, true);
        /* RIFF type */
        writeString(8, 'WAVE');
        /* format chunk identifier */
        writeString(12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, 1, true);
        /* sample rate */
        view.setUint32(24, this.TARGET_SAMPLE_RATE, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, this.TARGET_SAMPLE_RATE * 4, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, 1 * 2, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        writeString(36, 'data');
        /* data chunk length */
        view.setUint32(40, samplesArray.length, true);

        let offset = 44;
        for (let i = 0; i < samplesArray.length; i++, offset += 1) {
            const s = samples[i];
            view.setUint8(offset, s);
        }

        return Buffer.from(new Uint8Array(view.buffer));
    }
}
