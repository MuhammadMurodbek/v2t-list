import React from 'react'
import EventEmitter from '../models/events'

const EVENTS = {
  SEND: 'send',
  CANCEL: 'cancel',
  APPROVE_CHANGE: 'onApprovedChange',
  TOGGLE_PLAY: 'togglePlay',
  VOLUMEUP: 'volumeUp',
  VOLUMEDOWN: 'volumeDown',
  PLAYBACKUP: 'playbackSpeedUp',
  PLAYBACKDOWN: 'playbackSpeedDown',
  PLAY_AUDIO: 'playAudio',
  PAUSE_AUDIO: 'pauseAudio',
}

const KEY_CODE = {
  J: 74,
  K: 75,
  M: 77,
  N: 78,
  S: 83,
  P: 80,
  Q: 81,
  SPACE: 32,
  ESC: 27
}

const EventHandler = () => {
  const handleExternalKeydown = (event) => {
    switch (event.keyCode){
      case KEY_CODE.S: {
        if (event.ctrlKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.SEND)
          break
        }
      }
      case KEY_CODE.ESC: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.CANCEL)
          break
        }
      }
      case KEY_CODE.SPACE: {
        if (event.altKey && event.shiftKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.APPROVE_CHANGE)
          break
        }
      }
      case KEY_CODE.P: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.TOGGLE_PLAY)
          break
        }
      }
      case KEY_CODE.Q: {
        if (event.altKey) {
          event.preventDefault()
          if(event.shiftKey) {
            EventEmitter.dispatch(EVENTS.PAUSE_AUDIO)
            break
          }
          EventEmitter.dispatch(EVENTS.PLAY_AUDIO)
          break
        }
      }
      case KEY_CODE.J: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.VOLUMEUP)
          break
        }
      }
      case KEY_CODE.N: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.VOLUMEDOWN)
          break
        }
      }
      case KEY_CODE.K: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.PLAYBACKUP)
          break
        }
      }
      case KEY_CODE.M: {
        if (event.altKey) {
          event.preventDefault()
          EventEmitter.dispatch(EVENTS.PLAYBACKDOWN)
          break
        }
      }
    }
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleExternalKeydown)

    return () => {
      window.removeEventListener('keydown', handleExternalKeydown)
    }
  }, [])

  return <div/>
}

export {
  EVENTS,
  EventHandler
}
