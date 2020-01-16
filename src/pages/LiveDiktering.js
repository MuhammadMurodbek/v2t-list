import React, { Component } from 'react'
import { EuiText, EuiSpacer, EuiFlexGroup, EuiFlexItem, EuiButton } from '@elastic/eui'
import api from '../api'
import Editor from '../components/Editor'
import Mic from '../components/Mic'
import LiveTemplateEngine from '../components/LiveTemplateEngine'
import interpolateArray from '../models/interpolateArray'
import PersonalInformation from '../components/PersonalInformation'
import Tags from '../components/Tags'
import io from 'socket.io-client'
import Page from '../components/Page'
import processChapters from '../models/textProcessing/processChapters'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  socketio = io.connect('wss://ilxgpu9000.inoviaai.se/audio', { transports: ['websocket']})
  state = {
    recording: false,
    recordingAction: 'Starta',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    chapters: [{ keyword: "KONTAKTORSAK", segments: [{ words: "...", startTime: 0.00, endTime: 0.00 }] }],
    originalText: '',
    currentText: '',
    sections: ["KONTAKTORSAK", "AT", "LUNGOR", "BUK", "DIAGNOS"],
    isMicrophoneStarted: false,
    tags: []
  }

  componentDidMount = () => {
    this.templates()
    document.title = 'Inovia AI :: Live Diktering 🎤'   
  }

  templates = async () => {
    const templateList = await api.getSectionTemplates()
    this.setState({ listOfTemplates: templateList.data.templates })
  }

  onSelectText = () => {
    // update later
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  onUpdateTranscript = (chapters) => {
    // micStream.stop()
    this.setState({ chapters })
  }

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2);
    var merger = this.audioContext.createChannelMerger(2);
    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    return merger;
  }
  
  validateSections = (updatedSectionNames) => {
    const {sections} = this.state
    if(JSON.stringify(sections)!==JSON.stringify(updatedSectionNames)) {
      // cheeck if the current sections are incompatible  
      const { chapters } = this.state
      // shuffle chapters according to the new template
      let updatedText = ''
      chapters.forEach((chapter) => {
        updatedText = `${updatedText} ${chapter.keyword}`
        chapter.segments.forEach((segment) => {
          updatedText = `${updatedText} ${segment.words}`
        })
      })
      updatedText = updatedText.replace('KONTAKTORSAK', '')
      updatedText = updatedText.replace(/\s\s+/g, ' ');
      this.setState({ chapters: this.processChapters(updatedText, updatedSectionNames) })
    } // else do nothing 
  }

  updatedSections = (sections) => {
    this.validateSections(sections)
    this.setState({ sections }) 
  }

  processChapters = (finalText, updatedSections) => {
  // processChapters = (finalText) => {
    let {sections} = this.state
    if (updatedSections) {
      sections  = updatedSections
    } 
    let usedKeywords = ["KONTAKTORSAK"]
    const arrayList = sections
    const words = finalText.split(' ')
    let tempChapters = [{ keyword: "KONTAKTORSAK", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] }]
    words.forEach((word)=>{
      if (arrayList.includes(word.toUpperCase()) && !usedKeywords.includes(word.toUpperCase())){
        tempChapters.push({ keyword: word.toUpperCase(), segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push(word.toUpperCase())
      } else if (word === "allmäntillstånd") {
        tempChapters.push({ keyword: "AT", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push("AT")
      } else { 
        if (word === '\n') {
          console.log('found ny rad')
          // tempChapters[tempChapters.length - 1].segments[0].words = tempChapters[tempChapters.length - 1].segments[0].words + "\n"
          tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words} `
        } else {
          tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words}  ${word}`
        }
      }
    })
    return tempChapters
  }

  gotStream = (stream) => {
    // console.log('..........')
    // console.log(this.socketio.connected)
    // console.log('..........')
    const { recording } = this.state
    let inputPoint = this.audioContext.createGain();
    
    // Create an AudioNode from the stream.
    let realAudioInput = this.audioContext.createMediaStreamSource(stream);
    let audioInput = realAudioInput;

    audioInput = this.convertToMono(audioInput);
    audioInput.connect(inputPoint);

    let analyserNode = this.audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect(analyserNode);

    let scriptNode = (this.audioContext.createScriptProcessor || this.audioContext.createJavaScriptNode).call(this.audioContext, 1024, 1, 1);
    let prevState = this
    scriptNode.onaudioprocess = function (audioEvent) {
      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0);
        input = interpolateArray(input, 16000, 44100)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer);
        for (var i = 0, offset = 0; i < input.length; i++ , offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        prevState.socketio.emit('write-audio', buffer)
      }
    }
    inputPoint.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    let zeroGain = this.audioContext.createGain();
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain);
    zeroGain.connect(this.audioContext.destination);
    // updateAnalysers();
    this.socketio.on('add-transcript', function (text) {
      // add new recording to page
      const { originalText } = prevState.state
      prevState.setState({ currentText: text }, ()=>{
        // console.log('prevState.state.whole')
        const finalText = `${originalText} ${prevState.state.currentText}`
        // console.log(finalText)
        prevState.setState({ chapters: prevState.processChapters(finalText) })
      })
      // prevState.setState({ chapters: [{ keyword: "KONTAKTORSAK", segments: [{ words: text, startTime: 0.00, endTime: 0.00 }] }] })
    });
  }

  onCursorTimeChange = () => {
    
  }

  initAudio = () => {
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {

        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.gotStream(stream)
      })
      .catch(function (err) {
        console.log(err.name + ": " + err.message);
      });

  }


  toggleRecord = () => {
    if (this.audioContext === null) this.audioContext = new this.AudioContext()
    const { microphoneBeingPressed, originalText, currentText } = this.state
    if (microphoneBeingPressed === true) {
      console.log('stop recording')
      this.setState({ recording: false }, () => {
        this.setState({ microphoneBeingPressed: false })
        this.setState({ recordingAction: 'Starta' })
        // Close the socket
        this.socketio.emit('end-recording')
        this.socketio.close()
        this.setState({ originalText: `${originalText} ${currentText}` })
      })   
    } else {
      console.log('start recording')
      console.log(this.socketio.connected)
      this.setState({ recording: true }, ()=> {
        console.log('then')
        console.log(this.socketio.connected)
        this.setState({ microphoneBeingPressed: true })
        this.setState({ recordingAction: 'Avsluta' })
        this.initAudio()
        // console.log('button is clicked')
        this.socketio.emit('start-recording', {
          numChannels: 1,
          bps: 16,
          fps: parseInt(this.audioContext.sampleRate)
        })
      })   
    }
  }

  sendAsHorrribleTranscription = () => {

  }

  save = () => {
    /* Check the template compatibility, if the section headers don't belong to the template, 
    // notify the user and clear up the keywords and move the keyword as a regular text
    // as it was actually said by the speaker
    */
    console.log('this.socketiossss')
    console.log(this.socketio)
    console.log(this.socketio.connected)
    console.log('this.socketio')
    if (!this.socketio.connected) {
      this.socketio.connect('wss://ilxgpu9000.inoviaai.se/audio', { transports: ['websocket'] })
    }
  }

  render() {
    const { chapters, recordingAction, microphoneBeingPressed, listOfTemplates, sections, tags } = this.state
    const usedSections = chapters.map(chapter => chapter.keyword)
    return (
      <Page preferences title="">
        <EuiFlexGroup >
          <EuiFlexItem>
            <EuiText grow={false}>
              <h2>LiveDiktering (i/ai)</h2>
            </EuiText>
            <EuiSpacer size="m" />
            <PersonalInformation />
            <EuiSpacer size="l" />
            <EuiText grow={false}>
              <h3>Editor</h3>
            </EuiText>
            <EuiSpacer size="m" />
            <Editor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={0.00}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              onCursorTimeChange={this.onCursorTimeChange}
              isDiffVisible={false}
              sectionHeaders={sections}
              initialCursor={0}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 230, marginLeft: 30 }}>
            <EuiSpacer size="l" />
            <Mic
              recordingAction={recordingAction}
              microphoneBeingPressed={microphoneBeingPressed}
              toggleRecord={this.toggleRecord}
            />
            <EuiSpacer size="l" />
            <Tags
              tags={tags}
              updateTags={this.onUpdateTags}
            />
            <EuiSpacer size="l" />
            <LiveTemplateEngine listOfTemplates={listOfTemplates} usedSections={usedSections} updatedSections={this.updatedSections} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="secondary" onClick={() => { }}>Skicka till
                Co-Worker</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="danger" onClick={this.sendAsHorrribleTranscription}>“Skicka för granskning”
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton color="secondary" onClick={this.save}>Spara ändringar</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="danger" onClick={() => { }}>Avbryt</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
  )}
}


