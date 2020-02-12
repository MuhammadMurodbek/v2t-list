import React from 'react'
import { EuiListGroup, EuiListGroupItem } from '@elastic/eui'

const SectionHeadersList = ({headers}) => {
  if (headers) {
    return (
      <EuiListGroup
        flush={true}
        bordered={false}
        style={{ overflowX: 'auto', height: 700 }}
      >
        {headers.map((section) => {
          return (
            <EuiListGroupItem
              id={section.name}
              key={section.name}
              label={section.name.toUpperCase()}
              isActive={false}
            />)
        })}
      </EuiListGroup>
    )
  } else {
    return (
      <EuiListGroup
        flush={true}
        bordered={false}
        style={{ overflowX: 'auto', height: 700 }}
      >    
        <EuiListGroupItem
          id={'0'}
          key={1}
          label={'Ingen'}
          isActive={true}
        />
      </EuiListGroup>
    )
  } 
}

export default SectionHeadersList