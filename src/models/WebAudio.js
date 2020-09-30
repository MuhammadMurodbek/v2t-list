"use strict";
exports.__esModule = true;
var WebAudio = (function () {
    function WebAudio(sampleRate) {
        this.TARGET_SAMPLE_RATE = 16000;
        this.bufferUnusedSamples = new Float32Array();
        this.sourceSampleRate = sampleRate;
    }
    WebAudio.prototype.downsample = function (bufferNewSamples) {
        var buffer;
        var newSamples = bufferNewSamples.length;
        var unusedSamples = this.bufferUnusedSamples.length;
        var i;
        var offset;
        if (unusedSamples > 0) {
            buffer = new Float32Array(unusedSamples + newSamples);
            for (i = 0; i < unusedSamples; ++i) {
                buffer[i] = this.bufferUnusedSamples[i];
            }
            for (i = 0; i < newSamples; ++i) {
                buffer[unusedSamples + i] = bufferNewSamples[i];
            }
        }
        else {
            buffer = bufferNewSamples;
        }
        var filter = [
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
        var samplingRateRatio = this.sourceSampleRate / this.TARGET_SAMPLE_RATE;
        var nOutputSamples = Math.floor((buffer.length - filter.length) / samplingRateRatio) + 1;
        var outputBuffer = new Float32Array(nOutputSamples);
        for (i = 0; i < outputBuffer.length; i++) {
            offset = Math.round(samplingRateRatio * i);
            var sample = 0;
            for (var j = 0; j < filter.length; ++j) {
                sample += buffer[offset + j] * filter[j];
            }
            outputBuffer[i] = sample;
        }
        var indexSampleAfterLastUsed = Math.round(samplingRateRatio * i);
        var remaining = buffer.length - indexSampleAfterLastUsed;
        if (remaining > 0) {
            this.bufferUnusedSamples = new Float32Array(remaining);
            for (i = 0; i < remaining; ++i) {
                this.bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i];
            }
        }
        else {
            this.bufferUnusedSamples = new Float32Array(0);
        }
        return outputBuffer;
    };
    ;
    WebAudio.prototype.floatTo16BitPCM = function (input) {
        var output = new DataView(new ArrayBuffer(input.length * 2));
        for (var i = 0; i < input.length; i++) {
            var multiplier = input[i] < 0 ? 0x8000 : 0x7fff;
            output.setInt16(i * 2, (input[i] * multiplier) | 0, true);
        }
        return Buffer.from(output.buffer);
    };
    ;
    WebAudio.prototype.encodeWav = function (samples) {
        var samplesArray = new Uint8Array(samples);
        var buffer = new ArrayBuffer(44 + samplesArray.length);
        var view = new DataView(buffer);
        var writeString = function (offset, string) {
            for (var i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samplesArray.length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, this.TARGET_SAMPLE_RATE, true);
        view.setUint32(28, this.TARGET_SAMPLE_RATE * 4, true);
        view.setUint16(32, 1 * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samplesArray.length, true);
        var offset = 44;
        for (var i = 0; i < samplesArray.length; i++, offset += 1) {
            var s = samples[i];
            view.setUint8(offset, s);
        }
        return Buffer.from(new Uint8Array(view.buffer));
    };
    return WebAudio;
}());
exports["default"] = WebAudio;
//# sourceMappingURL=WebAudio.js.map