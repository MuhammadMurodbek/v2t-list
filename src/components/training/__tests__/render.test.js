// import dependencies
import React from 'react'
import {
  render,
  cleanup
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import Seek from '../../Seek'
import Mic from '../../Mic'
import ResetBar from '../../ResetBar'
import Player from '../../Player'

afterEach(cleanup)

test('render Mic component', () => {
  const { asFragment } = render(<Mic recordingAction="start" microphoneBeingPressed={false} toggleRecord={() => {}} />)
  expect(asFragment()).toMatchSnapshot()
})

it('render Seek component', () => {
  const { asFragment } = render(<Seek width={75} background="red" />)
  expect(asFragment()).toMatchSnapshot()
})

it('render ResetBar component', () => {
  const { asFragment } = render(
    <ResetBar
      showCancelBar
      showHideCancelBox={() => { }}
      resetState={() => {}}
    />
  )
  expect(asFragment()).toMatchSnapshot()
})

it('render Player component', () => {
  const originalChapters = [
    {
      keyword: 'GENERAL',
      segments: [
        {
          words: '8',
          startTime: 0,
          endTime: 2.62
        },
        {
          words: 'sidor',
          startTime: 2.7,
          endTime: 3.02
        },
        {
          words: 'se',
          startTime: 3.25,
          endTime: 3.68
        },
        {
          words: 'den',
          startTime: 4.24,
          endTime: 4.36
        },
        {
          words: '28',
          startTime: 4.56,
          endTime: 5.22
        },
        {
          words: 'februari',
          startTime: 5.52,
          endTime: 6.18
        }
      ]
    }]
  const { asFragment } = render(
    <Player
      audioTranscript={originalChapters}
      trackId="271ce3ce-d4e2-4ca3-b391-8e20d271b647"
      getCurrentTime={0}
      updateSeek={()=>{}}
      queryTerm=""
      isPlaying={false}
      isContentAudio
      // ref={this.playerRef}
      searchBoxVisible
      isTraining={false}
    />
  )
  expect(asFragment()).toMatchSnapshot()
})
