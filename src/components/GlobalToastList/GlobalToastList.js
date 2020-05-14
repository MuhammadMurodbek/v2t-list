import React, { useState } from 'react'
import { EuiGlobalToastList } from '@elastic/eui'

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

export { GlobalToastListContainer, addGlobalToast, clearGlobalToastList }
