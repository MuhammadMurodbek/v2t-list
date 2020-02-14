import React, { Fragment, useState } from 'react'
import moment from 'moment'
import ReactEcharts from 'echarts-for-react'

import {
  EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiDatePickerRange, EuiDatePicker
} from '@elastic/eui'


const TranscriptSentToCoworker = () => {
  const options = {
    title: {
      text: 'Transcripts sent to the co-workers'
    },
    tooltip: {},
    xAxis: { data: [ 'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni' ] },
    yAxis: {},
    series: [{
      name: 'Transcripts',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }]
  }
  const [start, setStart] = useState(moment().subtract(7, 'd'))
  const [end, setEnd] = useState(moment())
  const dateChangeStart = date => setStart(date)
  const dateChangeEnd = date => setEnd(date)

  return (
    <Fragment>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexItem grow={false} style={{ width: 400, height: '100px' }}>
            <EuiFormRow label="Datum">
              <EuiDatePickerRange
                startDateControl={
                  <EuiDatePicker
                    selected={start} dateFormat="YYYY-MM-DD HH:mm"
                    timeFormat="HH:mm" onChange={dateChangeStart}
                    startDate={start} endDate={end}
                    isInvalid={start > end} aria-label="Start date"
                    showTimeSelect
                  />
                }
                endDateControl={
                  <EuiDatePicker
                    selected={end} dateFormat="YYYY-MM-DD HH:mm"
                    timeFormat="HH:mm" onChange={dateChangeEnd}
                    startDate={start} endDate={end}
                    isInvalid={start > end} aria-label="End date"
                    showTimeSelect
                  />
                }
              />
            </EuiFormRow>
          </EuiFlexItem>
          <ReactEcharts option={options} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default TranscriptSentToCoworker