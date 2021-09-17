/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import {
  EuiButtonIcon,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiI18n,
  EuiToolTip
} from '@patronum/eui'

const ComplicatedField = ({
  complicatedFieldOptions,
  updateComplicatedFields,
  deleteComplicatedField,
  selectedChoice,
  sectionHeader,
  chapterId,
  createNewSectionAfterThis,
  isSingleSelectEnabled
}) => {
  const [selectedOption, setSelectedOption] = React.useState(
    isSingleSelectEnabled ? (
      complicatedFieldOptions[sectionHeader]
        .map((f) => {
          return selectedChoice.map((ch) => {
            if (ch.toLowerCase() === f.toLowerCase()) {
              return { label: f }
            }
          })
        })
        .flat(1)
        .filter((obj) => obj)
    ) : selectedChoice.map(choice => ({ label: choice.value }))
  )

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiI18n
          token="selectOptions"
          default="Select"
        >
          {(translation) => (
            <EuiComboBox
              placeholder={translation}
              style={{ width: 300 }}
              singleSelection={isSingleSelectEnabled}
              options={complicatedFieldOptions[sectionHeader].map((f) => {
                return { label: f }
              })}
              onChange={(value) => {
                setSelectedOption(value)
                updateComplicatedFields(value, chapterId, isSingleSelectEnabled)
              }}
              isClearable={true}
              selectedOptions={selectedOption}
            />
          )}
        </EuiI18n>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip position="top" content="Remove this section">
          <EuiButtonIcon
            aria-label="remove"
            color="danger"
            display="base"
            size="l"
            iconType="trash"
            onClick={() => deleteComplicatedField(chapterId)}
          />
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip position="top" content="Add a new section">
          <EuiButtonIcon
            aria-label="add"
            display="base"
            size="l"
            iconType="plusInCircle"
            onClick={() => createNewSectionAfterThis(chapterId)}
          />
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}
export default ComplicatedField
