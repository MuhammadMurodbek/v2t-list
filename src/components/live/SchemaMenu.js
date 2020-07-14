import React from 'react';

import {
  EuiContextMenu,
  EuiPopover
} from '@patronum/eui'

const SchemaMenu = ({schemasForMenu}) => {

  const flattenPanelTree = (tree, array = []) => {
    array.push(tree)
    if (tree.items) {
      tree.items.forEach(item => {
        if (item.panel) {
          flattenPanelTree(item.panel, array)
          item.panel = item.panel.id
        }
      })
    }
    return array
  }

  return (

    <EuiPopover
      style={{marginLeft: '200px'}}
      id="contextMenu"
      isOpen={true}
      panelPaddingSize="none"
      withTitle
      anchorPosition="rightBottom">
      <EuiContextMenu
        initialPanelId={0}
        panels={flattenPanelTree(schemasForMenu)}
      />
    </EuiPopover>
  )
}

export default SchemaMenu
