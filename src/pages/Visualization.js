// @ts-nocheck
import React, { useState } from 'react'
// import {
//     EuiFlexGroup, EuiFlexItem, EuiTextAlign, EuiText
// } from '@elastic/eui'
// const echarts = require('echarts')
import ReactEcharts from 'echarts-for-react'
import Page from '../components/Page'
import '../styles/pageNotFound.css'

const Visualization = () => {
  const [options, setOptions] = useState({
    title: {
      text: 'Transcripts sent to the co-workers'
    },
    tooltip: {},
    xAxis: {
      data: [
        'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni'
      ]
    },
    yAxis: {},
    series: [{
      name: 'Transcripts',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }]
  })
  
  return (
    <Page preferences title="Visualization">
      <ReactEcharts option={options} />
    </Page>
  )
}

export default Visualization