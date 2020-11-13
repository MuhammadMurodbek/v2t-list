import React from 'react'
import EventEmitter from '../models/events'

const EVENTS = {
  SEND: 'send',
  CANCEL: 'cancel',
  APPROVE_CHANGE: 'approve_check'
}

const EventHandler = () => {
  const handleExternalKeydown = (event) => {
    switch (event.keyCode){
      case 'sND': {
        EventEmitter.dispatch(EVENTS.SEND);
        break;
      }
      case 'cNL': {
        EventEmitter.dispatch(EVENTS.CANCEL);
        break;
      }
      case 'aPV': {
        EventEmitter.dispatch(EVENTS.APPROVE_CHANGE);
        break;
      }
      default: {
        console.log('Unhandled key event: ', event.keyCode)
      }
    }
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleExternalKeydown);

    // cleanup this component
    return () => {
      window.removeEventListener('keydown', handleExternalKeydown);
    }
  }, [])

  return <div/>
}

export {
  EVENTS,
  EventHandler
}
