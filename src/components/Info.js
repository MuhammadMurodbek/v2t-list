import React, { Component } from 'react'
import {
  EuiButtonEmpty, EuiSpacer, EuiFieldText, EuiButtonIcon,
  EuiFlexGroup, EuiFlexItem, EuiText, EuiForm
} from '@elastic/eui'
import '../styles/editor.css'

export default class Info extends Component {
  state = {
    patientId: '',
    patientNamn: '',
    isPersonnummerEditable: false,
    isPatientNameEditable: false
  }

  componentDidMount() {
    const { fields } = this.props
    this.setState({ patientId: fields.patient_id })
    this.setState({ patientNamn: fields.patient_full_name })
  }

  componentDidUpdate(prevProps) {
    const { fields } = this.props
    if (prevProps.fields !== fields) {
      this.setFields(fields)
    }
  }

  setFields = (fields) => {
    this.setState({ patientId: fields.patient_id })
    this.setState({ patientNamn: fields.patient_full_name })
  }

  changePersonnummmerEditStatus = () => {
    const { isPersonnummerEditable } = this.state
    this.setState({ isPersonnummerEditable: !isPersonnummerEditable })
  }

  onPersonnumerChange = (e) => {
    this.setState({ patientId: e.target.value })
  }

  changePatientNameEditStatus = () => {
    const { isPatientNameEditable } = this.state
    this.setState({ isPatientNameEditable: !isPatientNameEditable })
  }

  onPatientNameChange = (e) => {
    this.setState({ patientNamn: e.target.value })
  }

  render() {
    const {
      patientId,
      patientNamn,
      isPatientNameEditable,
      isPersonnummerEditable
    } = this.state

    return (
      <EuiForm>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className="euiText euiText--small">
              <div>
                <h2>
                  <span> Personnummer</span>
                </h2>
                <EuiText size="m">
                  <span
                    style={{ display: isPersonnummerEditable ? 'none' : 'flex' }}
                  >
                    {patientId}
                    &nbsp;
                    <EuiButtonIcon
                      style={{ display: isPersonnummerEditable ? 'none' : 'flex' }}
                      iconType="pencil"
                      aria-label="Next"
                      color="danger"
                      onClick={this.changePersonnummmerEditStatus}
                    />
                  </span>
                </EuiText>
                <EuiFieldText
                  style={{ display: isPersonnummerEditable ? 'flex' : 'none' }}
                  onChange={this.onPersonnumerChange}
                  value={patientId}
                  placeholder={patientId}
                  aria-label="Use aria labels when no actual label is in use"
                />
                <EuiSpacer size="s" />
                <EuiButtonEmpty
                  style={{ display: isPersonnummerEditable ? 'flex' : 'none' }}
                  onClick={this.changePersonnummmerEditStatus}
                >
                  Save
                </EuiButtonEmpty>
              </div>
            </div>
          </EuiFlexItem>
          <EuiFlexItem>
            <div className="euiText euiText--small">
              <div>
                <h2>
                  <span>Patientnamn</span>
                </h2>
                <EuiText size="m">
                  <span
                    style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                  >
                    {patientNamn}
                    &nbsp;
                    <EuiButtonIcon
                      style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                      iconType="pencil"
                      aria-label="Next"
                      color="danger"
                      onClick={this.changePatientNameEditStatus}
                    />
                  </span>
                </EuiText>
                <EuiFieldText
                  style={{ display: isPatientNameEditable ? 'flex' : 'none' }}
                  onChange={this.onPatientNameChange}
                  value={patientNamn}
                  placeholder={patientNamn}
                  aria-label="Use aria labels when no actual label is in use"
                />
                <EuiSpacer size="s" />
                <EuiButtonEmpty
                  style={{ display: isPatientNameEditable ? 'flex' : 'none' }}
                  onClick={this.changePatientNameEditStatus}
                >
                  Save
                </EuiButtonEmpty>
              </div>
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
    )
  }
}
