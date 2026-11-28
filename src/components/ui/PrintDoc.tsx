import { Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export function PrintDoc({ title, children }: { title: string; children: ReactNode }) {
  const doc = (
    <div className="rounded-xl border border-slate-200 bg-white p-6 print:border-0 print:p-0">
      <div className="mb-6 flex items-center justify-between border-b border-[#E7EAF0] pb-4">
        <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-10 w-auto object-contain" />
        <p className="text-lg font-semibold uppercase tracking-wide text-[#172033]">{title}</p>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      {doc}
      {createPortal(<div className="print-only-root hidden">{doc}</div>, document.body)}
      <div className="no-print mt-4 flex justify-end">
        <Button icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>
      </div>
    </div>
  )
}

export function Row({ k, v, bold }: { k: string; v: ReactNode; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${bold ? 'border-t border-slate-200 font-bold text-slate-900' : 'text-slate-600'}`}>
      <span>{k}</span><span className={bold ? '' : 'font-medium text-slate-800'}>{v}</span>
    </div>
  )
}
