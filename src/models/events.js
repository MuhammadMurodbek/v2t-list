const events = {}

const EventEmitter = {
  dispatch: (event, data) => {
    if(!events[event]) return
    events[event].forEach(callback => callback(data))
  },
  subscribe: (event, callback) => {
    if(!events[event]) events[event] = []
    events[event].push(callback)
  },
  unsubscribe: (event) => {
    if(!events[event]) return
    delete events[event]
  }
}

export default EventEmitter