import React from 'react';

import {
//   EuiButton,
//   EuiFormRow,
//   EuiSwitch,
//   EuiSpacer,
  EuiContextMenu,
  EuiPopover
} from '@elastic/eui'

const TemplateMenu = ({templatesForMenu}) => {
  
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

//   const closePopover = () => {
//     console.log('hello end')
//     console.log(templatesForMenu)
//   }

//   const templateTree = {
//     id: 0,
//     title: 'Journalmallar',
//     items: [
//       {
//         name: "Jourbesök",
//         id: 'ssss',
//         panel: {
//           id: 1,
//           title: 'sections',
//           items: [
//             { name: 'Kontaktorsak', onClick: () => {closePopover() }},
//             { name: 'Socialt' },
//             { name: 'Tidigare sjukdomar' },
//             { name: 'Hereditet' },
//             { name: 'Aktuella läkemedel' },
//             { name: 'Anamnes' },
//             { name: 'Aktuellt' }
//           ]
//         }
//       }
//     ]
//   }

//   const panelTree = {
//     id: 0,
//     title: 'Journalmallar',
//     items: [
//       {
//         name: 'Handle an onClick',
//         onClick: () => {
//           closePopover()
          
//         }
//       }, {
//         name: 'Go to a link',
//         icon: 'user',
//         href: 'http://elastic.co',
//         target: '_blank'
//       }, {
//         name: 'Nest panels',
//         icon: 'user',
//         panel: {
//           id: 1,
//           title: 'Nest panels',
//           items: [
//             {
//               name: 'PDF reports',
//               icon: 'user',
//               onClick: () => {
//                 closePopover()
//                 window.alert('PDF reports')
//               }
//             }, {
//               name: 'Embed code',
//               icon: 'user',
//               panel: {
//                 id: 2,
//                 title: 'Embed code',
//                 content: (
//                   <div style={{ padding: 16 }}>
//                     <EuiFormRow
//                       label="Generate a public snapshot?"
//                       hasChildLabel={false}
//                     >
//                       <EuiSwitch
//                         name="switch"
//                         id="asdf"
//                         label="Snapshot data"
//                         checked={true}
//                         onChange={() => { }}
//                       />
//                     </EuiFormRow>
//                     <EuiFormRow
//                       label="Include the following in the embed"
//                       hasChildLabel={false}
//                     >
//                       <EuiSwitch
//                         name="switch"
//                         id="asdf2"
//                         label="Current time range"
//                         checked={true}
//                         onChange={() => { }}
//                       />
//                     </EuiFormRow>
//                     <EuiSpacer />
//                     <EuiButton fill>
//                       Copy iFrame code
//                     </EuiButton>
//                   </div>
//                 )
//               }
//             }, {
//               name: 'Permalinks',
//               icon: 'user',
//               onClick: () => {
//                 closePopover();
//                 window.alert('Permalinks');
//               }
//             }]}
//       }, {
//         name: 'You can add a tooltip',
//         icon: 'user',
//         toolTipTitle: 'Optional tooltip',
//         toolTipContent: 'Optional content for a tooltip',
//         toolTipPosition: 'right',
//         onClick: () => {
//           closePopover()
//           window.alert('Display options')
//         }
//       }, {
//         name: 'Disabled option',
//         icon: 'user',
//         toolTipContent: 'For reasons, this item is disabled',
//         toolTipPosition: 'right',
//         disabled: true,
//         onClick: () => {
//           closePopover()
//           window.alert('Disabled option')
//         }
//       }
//     ]
//   }

//   const panels = flattenPanelTree(panelTree)
//   const panels = flattenPanelTree(templateTree)
//   const panels = flattenPanelTree(templatesForMenu)
    

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
        panels={flattenPanelTree(templatesForMenu)} 
      />
    </EuiPopover>
  )
}

export default TemplateMenu