import { useState, useCallback } from "react"

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  })

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setState({ data: null, error: null, isLoading: true })
    try {
      const result = await asyncFunction()
      setState({ data: result, error: null, isLoading: false })
      return result
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setState({ data: null, error: errorObj, isLoading: false })
      return null
    }
  }, [])

  return { ...state, execute }
}
