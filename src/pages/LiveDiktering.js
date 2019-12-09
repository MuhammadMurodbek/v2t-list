import React, { Component, useState, Fragment, useEffect } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiText
} from '@elastic/eui'
import api from '../api'
import Page from '../components/Page'
import Mic from '../components/Mic'
import LiveTemplateEngine from '../components/LiveTemplateEngine'
import '../styles/simple-player.css'

const LiveDiktering = () => {
    const [transcribeException, setTranscribeException] = useState(false)
    const [theWholeTruth, setTheWholeTruth] = useState('')
    const [currentMessage, setCurrentMessage] = useState('')
    const [previousMessage, setPreviousMessage] = useState('')
    const [wordDump, setWordDump] = useState([])
    const [isMicStopped, setIsMicStopped] = useState(true)
    const [microphoneBeingPressed, setMicrophoneBeingPressed] = useState(false)
    const [recordingAction, setRecordingAction] = useState('start')
    const [listOfTemplates, setListOfTemplates] = useState([])

    useEffect(() => {
      templates()
    }, []);


    const templates = async () => { 
      const templateList = await api.getSectionTemplates()
      console.log('templateList')
      console.log(templateList.data.templates)
      setListOfTemplates(templateList.data.templates)
    }

    // const createPresignedUrl = () => {
    //     console.log('process.env.AMAZON_KEY')
    //     let endpoint = "transcribestreaming.eu-west-3.amazonaws.com:8443"
    //     return v4.createPresignedURL(
    //         'GET',
    //         endpoint,
    //         '/stream-transcription-websocket',
    //         'transcribe',
    //         crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
    //         'key': process.env.AMAZON_KEY,
    //         'secret': process.env.AMAZON_SECRET,
    //         'sessionToken': '',
    //         'protocol': 'wss',
    //         'expires': 15,
    //         'region': 'eu-west-3',
    //         'query': "language-code=en-US&media-encoding=pcm&sample-rate=44100"
    //     }
    //     )
    // }

    // const getAudioEventMessage = (buffer) => {
    //     // wrap the audio data in a JSON envelope
    //     return {
    //         headers: {
    //             ':message-type': {
    //                 type: 'string',
    //                 value: 'event'
    //             },
    //             ':event-type': {
    //                 type: 'string',
    //                 value: 'AudioEvent'
    //             }
    //         },
    //         body: buffer
    //     }
    // }


    // const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8)

    // const convertAudioToBinaryMessage = (audioChunk) => {
    //     let raw = mic.toRaw(audioChunk);

    //     if (raw == null)
    //         return;

    //     // downsample and convert the raw audio bytes to PCM
    //     let dsampledBuffer = downsampleBuffer(raw, 44100);
    //     let pEncodedBuffer = pcmEncode(dsampledBuffer);

    //     // add the right JSON headers and structure to the message
    //     let audioEventMessage = getAudioEventMessage(Buffer.from(pEncodedBuffer));

    //     //convert the JSON object + headers into a binary event stream message
    //     let binary = eventStreamMarshaller.marshall(audioEventMessage);

    //     return binary;
    // }

    // const handleEventStreamMessage = (messageJson) => {
    //     //   let results = messageJson.Transcript.Results
    //     //   if (results.length > 0) {
    //     //     if (results[0].Alternatives.length > 0) {
    //     //       let transcript = results[0].Alternatives[0].Transcript
    //     //       // fix encoding for accented characters
    //     //       transcript = decodeURIComponent(escape(transcript))
    //     //       // update the textarea with the latest result
    //     //       $('#transcript').val(transcription + transcript + "\n")
    //     //       // if this transcript segment is final, add it to the overall transcription
    //     //       if (!results[0].IsPartial) {
    //     //         //scroll the textarea down
    //     //         $('#transcript').scrollTop($('#transcript')[0].scrollHeight)
    //     //         transcription += transcript + "\n"
    //     //       }
    //     //     }
    //     //   }
    // }

    // const compareWithPreviousMessage = (currentMessage) => {
    //     // console.log('currentMessage')
    //     // console.log(currentMessage)
    //     if (currentMessage) {
    //         // If both of the message has the same first word
    //         // Then replace the previous message with the current message
    //         if (currentMessage.split(' ')[0] === previousMessage.split(' ')[0]) {
    //             // console.log('first word match')
    //             setPreviousMessage(currentMessage)

    //             // if the previous message is '' replace it too 
    //         } else if (previousMessage === '') {
    //             // console.log('Previous word is empty')
    //             setPreviousMessage(currentMessage)

    //             // if the previous message is not have the same first word
    //         } else if (currentMessage.split(' ')[0] !== previousMessage.split(' ')[0]) {
    //             // move the previous message to the whole truth
    //             setTheWholeTruth(`${theWholeTruth} ${previousMessage}`)
    //             // now change the previous message with the current message 
    //             setPreviousMessage(currentMessage)
    //         }
    //     }
    // }

    // const hasPunctuation = (str) => {
    //     if (str.includes('.')
    //         || str.includes('?')
    //         || str.includes('!')
    //     ) return true
    //     return false
    // }

    // const postPrecess = (content) => {
    //     // if (content.length === 0) return "start speaking ..."
    //     let finalText = ''
    //     let total = []
    //     content.map(str => {
    //         total.push(str)
    //     })

    //     // total has everything, now process
    //     let tempString = ''
    //     let finalStrings = []
    //     total.map((str, i) => {
    //         if (i > 0 && i < total.length - 1) {
    //             if (str.split(' ')[0] === total[i - 1].split(' ')[0]) {
    //                 tempString = str
    //             } else {
    //                 finalStrings.push(tempString)
    //                 tempString = ''
    //             }
    //         }
    //     })

    //     let processedString = ''
    //     finalStrings.map(str => {
    //         processedString = processedString + str
    //         if (hasPunctuation(str)) processedString = processedString + ' '
    //     })

    //     console.log('processedString')
    //     console.log(processedString)
    //     console.log('processedString')
    //     setWordDump(processedString)
    // }


    // const wireSocketEvents = (socket) => {
    //     // handle inbound messages from Amazon Transcribe    
    //     let stringDump = []
    //     let prevString = ''
    //     socket.onmessage = function (message) {
    //         //convert the binary event stream message to JSON
    //         let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data))
    //         let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body))
    //         if (messageWrapper.headers[":message-type"].value === "event") {
    //             // handleEventStreamMessage(messageBody)
    //             if (messageBody.Transcript.Results[0]) {
    //                 stringDump.push(messageBody.Transcript.Results[0].Alternatives[0].Transcript)
    //             }
    //             // console.log('-----')
    //             // console.log(stringDump)
    //             // console.log('-----')
    //             postPrecess(stringDump)
    //             //setWordDump(stringDump)
    //         } else {
    //             console.log('Straming is not working ')
    //             // console.log(socket)
    //             setTranscribeException(true)
    //             //console.log('messageBody.Message')
    //             console.log(messageBody.Message)
    //             // toggleStartStop()
    //         }
    //     }
    // }

  const streamAudioToWebSocket = (userMediaStream) => {
    console.log('started streamimng')
  //   const micStream = new mic()
  //   micStream.setStream(userMediaStream)
  //   let url = createPresignedUrl()
  //   console.log('url')
  //   console.log(url)
  //   //open up our WebSocket connection
  //   const socket = new WebSocket(url);
  //   socket.binaryType = "arraybuffer";

  //   // when we get audio data from the mic, send it to the WebSocket if possible
  //   socket.onopen = function () {
  //   micStream.on('data', function (rawAudioChunk) {
  //     // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
  //     let binary = convertAudioToBinaryMessage(rawAudioChunk);

  //     if (socket.OPEN)
  //       socket.send(binary)
  //     })
  //   }

  //   // handle messages, errors, and close events
  //   wireSocketEvents(socket)
  // }

    // const stopRecording = () => {
    //     // micStream.stop();
    //     // // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
    //     // let emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));

    }




  const startDiktation = () => {
    console.log('start')
    window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    })
      // ...then we convert the mic stream to binary event stream messages when the promise resolves 
      // .then(streamAudioToWebSocket)
      // .catch(function (error) {
      //   console.log('Error happened')
      //   console.log(error)
      // });
    }
    
    const stopDiktation = () => {
      console.log('stopDiktation')
    }

    const toggleRecord = () => {
      if (microphoneBeingPressed === true) {
        stopDiktation()
        setMicrophoneBeingPressed(false)
        setRecordingAction('start')
      } else {
        startDiktation() 
        setMicrophoneBeingPressed(true)
        setRecordingAction('stop')
      }
    }


    return (
      <Page preferences title="">
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <Mic
          recordingAction={recordingAction}
          microphoneBeingPressed={microphoneBeingPressed}
          toggleRecord={toggleRecord}
        /> 
        <EuiSpacer size="l"/>
        <EuiSpacer size="l"/>
        <EuiSpacer size="l"/>
        <EuiFlexGroup >
          <EuiFlexItem>
            <EuiText>
              <pre>
                <code
                  contentEditable
                  suppressContentEditableWarning
                >Börja diktering ...</code>
              </pre>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 230, marginLeft: 30 }}>
            <LiveTemplateEngine 
              listOfTemplates={listOfTemplates}
            /> 
          </EuiFlexItem>
        </EuiFlexGroup>

            <Fragment>
                <EuiFlexGroup gutterSize="s" alignItems="center">
                    <EuiFlexItem>
                        <EuiSpacer size="l" />
                        <EuiSpacer size="l" />
                        <EuiSpacer size="l" />
                        
                    {/* <SimplifiedEditor content={wordDump} /> */}
                        {/* <SimplifiedEditor content={wordDump} /> */}
                    </EuiFlexItem>
                </EuiFlexGroup>
            </Fragment>
        </Page>
    )
}

export default LiveDiktering
