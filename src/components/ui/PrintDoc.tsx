import { Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function PrintDoc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="print-area rounded-xl border border-slate-200 p-6">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xl font-bold text-slate-900">Institute <span className="text-brand-600">Pro</span></p>
            <p className="text-xs text-slate-500">12 MG Road, Bengaluru · +91 80000 00000</p>
          </div>
          <p className="text-lg font-semibold uppercase tracking-wide text-slate-700">{title}</p>
        </div>
        {children}
      </div>
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
