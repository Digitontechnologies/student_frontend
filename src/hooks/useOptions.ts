import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Fetch a lightweight list from the API for dropdowns/filters (fallback used only if API fails). */
export function useApiList<T>(path: string, fallback: T[] = []): T[] {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    let alive = true
    api.get<T[]>(path)
      .then((rows) => { if (alive && Array.isArray(rows)) setItems(rows) })
      .catch(() => { if (alive) setItems(fallback) })
    return () => { alive = false }
  }, [path])
  return items
}
