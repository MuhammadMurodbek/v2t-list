import React from 'react'

const withProvider = (Component, Provider) => {
  return class extends React.Component {
    render() {
      return (
        <Provider>
          <Component { ...this.props }/>
        </Provider>
      )
    }
  }
}

export default withProvider
