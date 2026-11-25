import { useEffect, useState } from 'react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import type { Enquiry } from '../data/mock'
import { fmtDate, today } from '../lib/utils'
import { api } from '../lib/api'

const sources = ['Website', 'Walk-in', 'Instagram', 'Referral', 'Google Ads']
const statuses = ['New', 'Contacted', 'Follow-up', 'Converted', 'Lost']

export default function Enquiries() {
  const toast = useToast()
  const [apiCourseNames, setApiCourseNames] = useState<string[]>([])
  useEffect(() => {
    api.get<{ name: string }[]>('/courses').then((cs) => {
      setApiCourseNames(cs.map((c) => c.name))
    }).catch(() => {})
  }, [])

  return (
    <CrudPage<Enquiry>
      title="Enquiries & Leads" subtitle="Track prospective students from enquiry to admission" entity="Enquiry" idPrefix="ENQ"
      initial={[]} searchKeys={['name', 'id', 'phone', 'course']} defaults={{ date: today(), status: 'New' }}
      apiPath="/enquiries"
      filters={[{ key: 'status', label: 'Status', options: statuses }, { key: 'source', label: 'Sources', options: sources }]}
      columns={[
        { key: 'name', header: 'Lead', render: (r) => <div><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
        { key: 'phone', header: 'Phone' }, { key: 'course', header: 'Interested in' }, { key: 'source', header: 'Source' },
        { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'course', label: 'Course', type: 'select', options: apiCourseNames },
        { name: 'source', label: 'Source', type: 'select', options: sources },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: statuses },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      rowActions={(r, { update }) =>
        r.status !== 'Converted' ? (
          <Button size="sm" variant="secondary" onClick={() => { update({ ...r, status: 'Converted' }); toast(`${r.name} marked as converted`) }}>Convert</Button>
        ) : null
      }
      viewRender={(r) => <Detail items={[['ID', r.id], ['Name', r.name], ['Phone', r.phone], ['Course', r.course], ['Source', r.source], ['Date', fmtDate(r.date)], ['Status', <Badge>{r.status}</Badge>], ['Notes', r.notes]]} />}
    />
  )
}
