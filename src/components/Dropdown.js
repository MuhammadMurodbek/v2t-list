import React, { Fragment } from 'react'
import axios from 'axios'
import {
  EuiSpacer,
  EuiText
} from '@elastic/eui'
import { usePreferences } from '../components/PreferencesProvider'
import Page from '../components/Page'

const DropDown = ({ title, content }) => (
  <Fragment>
    <strong>{title}</strong>
  </Fragment>
)

export default DropDown