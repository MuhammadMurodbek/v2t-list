import React from 'react'
import { EuiBadge } from '@elastic/eui'
import packageInformation from '../../package.json'

const VersionBadge = () => {
  return (
    <div style={{ position: 'absolute', top: 0, right: 0 }}>
      <EuiBadge color="#076EFF">
        <div
          style={{
            color: '#fff',
            fontWeight: 'normal',
            fontSize: '13px',
            padding: '1px 0'
          }}
        >
          Version {packageInformation.version}
        </div>
      </EuiBadge>
    </div>
  )
}

export default VersionBadge
