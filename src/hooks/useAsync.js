import { useReducer, useCallback } from 'react'
import { useSafeDispatch } from './useSafeDispatch'

export const asyncActionTypes = {
  success: 'resolved',
  error: 'rejected',
  loading: 'pending',
  idle: 'idle'
}

const asyncReducer = (state, action) => {
  switch (action.type) {
  case asyncActionTypes.loading: { 
    return { status: asyncActionTypes.loading, data: null, error: null }
  }
  case asyncActionTypes.success: {
    return { status: asyncActionTypes.success, data: action.data, error: null }
  }
  case asyncActionTypes.error: {
    return { status: asyncActionTypes.error, data: null, error: action.error }
  }
  default: {
    throw new Error(`Unhandled action type: ${action.type}`)
  }
  }
}

export const useAsync = (initialState) => {
  const [state, unsafeDispatch] = useReducer(asyncReducer, {
    status: asyncActionTypes.idle,
    data: null,
    error: null,
    ...initialState
  })

  const dispatch = useSafeDispatch(unsafeDispatch)

  const run = useCallback(promise => {
    dispatch({ type: asyncActionTypes.loading })
    promise.then(
      ({ data }) => {
        dispatch({ type: asyncActionTypes.success, data })
      },
      error => {
        dispatch({ type: asyncActionTypes.error, error })
      }
    )
  }, [dispatch])

  const setData = useCallback(
    data => dispatch({ type: asyncActionTypes.success, data }),
    [dispatch]
  )
  const setError = useCallback(
    error => dispatch({ type: asyncActionTypes.error, error }),
    [dispatch]
  )

  return { ...state, run, setData, setError }
}