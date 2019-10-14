/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, {Fragment} from 'react'
import {
    EuiSpacer,
    EuiText
} from '@elastic/eui'
import PropTypes from 'prop-types'


const DropDown = ({ title, content }) => (
    <Fragment>
        <strong>{title}</strong>
        <EuiSpacer size="xs" />
        <EuiText size="s" color="subdued">
            <p className="euiTextColor--subdued">
                {content}
            </p>
        </EuiText>
    </Fragment>
)

DropDown.propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.string
}


export default DropDown