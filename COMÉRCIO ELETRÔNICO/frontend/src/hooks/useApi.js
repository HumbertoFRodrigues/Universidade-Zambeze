import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
export function useApi(path) {
  const [state, setState] = useState({ path: null, data: null, error: null, loading: true })
  useEffect(() => {
    const controller = new AbortController()
    api(path, { signal: controller.signal })
      .then(data => setState({ path, data, error: null, loading: false }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ path, data: null, error: error.message, loading: false })
      })
    return () => controller.abort()
  }, [path])
  return state.path === path ? state : { data: null, error: null, loading: true }
}
