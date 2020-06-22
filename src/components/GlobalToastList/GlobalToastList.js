import React, { useState } from 'react'
import { EuiGlobalToastList, EuiI18n } from '@elastic/eui'

let addToastHandler
let clearToastsHandler

const addGlobalToast = (
  title,
  text = '',
  type = 'primary',
  icon = '',
  lifeTime = 6000
) => {
  addToastHandler(title, text, type, icon, lifeTime)
}

const clearGlobalToastList = () => {
  clearToastsHandler()
}

const addErrorToast = (title = null, message = null) => {
  if (!title) return

  addGlobalToast(title, message && <p>{message}</p>, 'danger', 'alert')
}

const addUnexpectedErrorToast = () =>
  addErrorToast(
    <EuiI18n token="error" default="Error" />,
    <EuiI18n token="unexpectedError" default="Unexpected error occurred" />
  )

const addWarningToast = (title = null, message = null, optionalString='') => {
  if (!title) return

  addGlobalToast(title, message && <p>{message} {optionalString}</p>, 'warning', 'help')
}

const addSuccessToast = (title = null, message = null) => {
  if (!title) return

  addGlobalToast(title, message && <p>{message}</p>, 'success', 'check')
}

const GlobalToastListContainer = () => {
  const [toasts, setToasts] = useState([])

  addToastHandler = (title, text, color, iconType, toastLifeTimeMs) => {
    setToasts(
      toasts.concat({
        id: `${Date.now()}`,
        title,
        color,
        iconType,
        toastLifeTimeMs,
        text
      })
    )
  }

  const removeToast = (removedToast) => {
    setToasts(toasts.filter((toast) => toast.id !== removedToast.id))
  }

  clearToastsHandler = () => {
    setToasts([])
  }

  return (
    <EuiGlobalToastList
      toasts={toasts}
      dismissToast={removeToast}
      toastLifeTimeMs={6000}
    />
  )
}

export {
  GlobalToastListContainer,
  addGlobalToast,
  clearGlobalToastList,
  addErrorToast,
  addUnexpectedErrorToast,
  addWarningToast,
  addSuccessToast
}
