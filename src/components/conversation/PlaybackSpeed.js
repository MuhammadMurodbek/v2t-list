import React, { useState } from 'react'
import {
  EuiText,
  // EuiButton,
  // EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiPopover
} from '@elastic/eui'

const PlaybackSpeed = () => {
  const [isPopoverOpen, setPopover] = useState(false)
  const [rowSize, setRowSize] = useState('1.0')
  const onButtonClick = () => {
    setPopover(!isPopoverOpen)
  }
  const closePopover = () => {
    setPopover(false)
  }
  // const getIconType = (size) => {
  //   return size === rowSize ? 'check' : 'empty'
  // }
  const buttonStyle = {
    cursor: 'pointer'
  }
  const speedMenu = (
    <EuiText>
      <p onClick={onButtonClick} style={buttonStyle}>
        {rowSize} {isPopoverOpen ? '▴' : '▾' }
      </p>
    </EuiText>
  )

  const items = [
    <EuiContextMenuItem
      key="0.0"
      onClick={() => {
        closePopover()
        setRowSize('0.0')
      }}
    >
      0.0
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="0.2"
      onClick={() => {
        closePopover()
        setRowSize('0.2')
      }}
    >
      0.2
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="0.4"
      onClick={() => {
        closePopover()
        setRowSize('0.4')
      }}
    >
      0.4
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="0.6"
      onClick={() => {
        closePopover()
        setRowSize('0.6')
      }}
    >
      0.6
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="0.8"
      onClick={() => {
        closePopover()
        setRowSize('0.8')
      }}
    >
      0.8
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="1.0"
      onClick={() => {
        closePopover()
        setRowSize('1.0')
      }}
    >
      1.0
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="1.2"
      onClick={() => {
        closePopover()
        setRowSize('1.2')
      }}
    >
      1.2
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="1.4"
      onClick={() => {
        closePopover()
        setRowSize('1.4')
      }}
    >
      1.4
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="1.6"
      onClick={() => {
        closePopover()
        setRowSize('1.6')
      }}
    >
      1.6
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="1.8"
      onClick={() => {
        closePopover()
        setRowSize('1.8')
      }}
    >
      1.8
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="2.0"
      onClick={() => {
        closePopover()
        setRowSize('2.0')
      }}
    >
      2.0
    </EuiContextMenuItem>
  ]

  const divProperties = {
    position: 'absolute',
    marginLeft: 147,
    marginTop: 14
  }

  return (
    <div style={divProperties}>
      <EuiPopover
        id="singlePanel"
        button={speedMenu}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiContextMenuPanel size="s" items={items} />
      </EuiPopover>
    </div>
  )
}

export default PlaybackSpeed
