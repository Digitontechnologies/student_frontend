import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

/** Generic hook to fetch a list from the API and manage CRUD state. */
export function useApi<T extends { id: string }>(path: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathRef = useRef(path)
  pathRef.current = path

  const fetchData = useCallback(async () => {
    if (!pathRef.current) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await api.get<T[]>(pathRef.current)
      setData(rows)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const create = useCallback(async (body: Partial<T>): Promise<T> => {
    const result = await api.post<T>(pathRef.current, body)
    await fetchData()
    return result
  }, [fetchData])

  const update = useCallback(async (id: string, body: Partial<T>): Promise<void> => {
    await api.put(`${pathRef.current}/${encodeURIComponent(id)}`, body)
    await fetchData()
  }, [fetchData])

  const remove = useCallback(async (id: string): Promise<void> => {
    await api.del(`${pathRef.current}/${encodeURIComponent(id)}`)
    await fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, create, update, remove }
}
