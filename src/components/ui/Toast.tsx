import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, X } from 'lucide-react'

type Ctx = (msg: string) => void
const ToastCtx = createContext<Ctx>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setItems((i) => [...i, { id, msg }])
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 3000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 no-print">
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {t.msg}
            <button onClick={() => setItems((i) => i.filter((x) => x.id !== t.id))}><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
