import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Zone = {
  id: string
  name: string
  countries: string[]
  postcodes: string[]
  priority: number
  enabled: boolean
  methods: Array<{
    id: string
    name: string
    type: string
    enabled: boolean
    flatAmountCents: number | null
    freeAboveCents: number | null
    surchargePct: number
  }>
}

type Credential = {
  provider: string
  enabled: boolean
  sandbox: boolean
  accountId: string | null
  hasKey: boolean
  hasSecret: boolean
}

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}/api/v1/admin/shipping${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  const json = (await res.json()) as { data: T }
  return json.data
}

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') ?? '')
  const [zones, setZones] = useState<Zone[]>([])
  const [creds, setCreds] = useState<Credential[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'zones' | 'carriers' | 'simulate'>('zones')

  const [simAddress, setSimAddress] = useState({
    firstName: 'Mario',
    lastName: 'Rossi',
    line1: 'Via Roma 1',
    city: 'Milano',
    postalCode: '20100',
    country: 'IT',
  })
  const [simQuotes, setSimQuotes] = useState<Array<{ label: string; amountCents: number }>>([])

  async function reload() {
    if (!token) return
    try {
      const [z, c] = await Promise.all([
        api<Zone[]>(token, '/zones'),
        api<Credential[]>(token, '/credentials'),
      ])
      setZones(z)
      setCreds(c)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }

  useEffect(() => {
    if (!token) return
    localStorage.setItem('adminToken', token)
    void reload()
  }, [token])

  async function saveCredential(provider: 'DHL' | 'FEDEX', form: HTMLFormElement) {
    const fd = new FormData(form)
    await api(token, '/credentials', {
      method: 'PUT',
      body: JSON.stringify({
        provider,
        enabled: fd.get('enabled') === 'on',
        sandbox: fd.get('sandbox') === 'on',
        accountId: fd.get('accountId') || null,
        apiKey: fd.get('apiKey') || null,
        apiSecret: fd.get('apiSecret') || null,
      }),
    })
    await reload()
  }

  async function runSimulate() {
    setSimQuotes([])
    const res = await fetch(`${apiUrl}/api/v1/admin/shipping/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      credentials: 'include',
      body: JSON.stringify({ shippingAddress: simAddress }),
    })
    if (!res.ok) {
      setError(await res.text())
      return
    }
    const json = (await res.json()) as { data: Array<{ label: string; amountCents: number }> }
    setSimQuotes(json.data)
  }

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>Admin spedizioni — Idea di Luce</h1>
      <p style={{ color: '#555' }}>Zone, corrieri DHL/FedEx, margini. API: {apiUrl}</p>

      <label style={{ display: 'block', margin: '1rem 0' }}>
        Token admin (X-Admin-Token)
        <input
          style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['zones', 'carriers', 'simulate'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ fontWeight: tab === t ? 700 : 400 }}>
            {t === 'zones' ? 'Zone' : t === 'carriers' ? 'Corrieri' : 'Simulatore'}
          </button>
        ))}
      </nav>

      {tab === 'zones' ? (
        <section>
          {zones.map((z) => (
            <article key={z.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <h2>
                {z.name} <small>({z.countries.join(', ')})</small>
              </h2>
              <ul>
                {z.methods.map((m) => (
                  <li key={m.id}>
                    <strong>{m.name}</strong> — {m.type}
                    {m.flatAmountCents != null ? ` · €${(m.flatAmountCents / 100).toFixed(2)}` : ''}
                    {m.freeAboveCents != null ? ` · gratis sopra €${(m.freeAboveCents / 100).toFixed(0)}` : ''}
                    {m.surchargePct ? ` · +${m.surchargePct}%` : ''}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'carriers' ? (
        <section>
          {creds.map((c) => (
            <form
              key={c.provider}
              style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12, borderRadius: 8 }}
              onSubmit={(e) => {
                e.preventDefault()
                void saveCredential(c.provider as 'DHL' | 'FEDEX', e.currentTarget)
              }}
            >
              <h3>{c.provider}</h3>
              <label>
                <input type="checkbox" name="enabled" defaultChecked={c.enabled} /> Abilitato
              </label>
              <label style={{ marginLeft: 12 }}>
                <input type="checkbox" name="sandbox" defaultChecked={c.sandbox} /> Sandbox
              </label>
              <div style={{ marginTop: 8 }}>
                <input name="accountId" placeholder="Account number" defaultValue={c.accountId ?? ''} style={{ width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginTop: 8 }}>
                <input name="apiKey" placeholder={c.hasKey ? 'API key (lascia vuoto per non cambiare)' : 'API key'} style={{ width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginTop: 8 }}>
                <input name="apiSecret" placeholder={c.hasSecret ? 'Secret (lascia vuoto)' : 'API secret'} style={{ width: '100%', padding: 6 }} />
              </div>
              <button type="submit" style={{ marginTop: 8 }}>
                Salva
              </button>
            </form>
          ))}
        </section>
      ) : null}

      {tab === 'simulate' ? (
        <section>
          <p>Richiede sessione PWA attiva sullo stesso browser (cookie) o usa la PWA per test end-to-end.</p>
          <div style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
            {(['firstName', 'lastName', 'line1', 'city', 'postalCode', 'country'] as const).map((k) => (
              <input
                key={k}
                value={simAddress[k]}
                onChange={(e) => setSimAddress({ ...simAddress, [k]: e.target.value })}
                placeholder={k}
              />
            ))}
          </div>
          <button type="button" style={{ marginTop: 12 }} onClick={() => void runSimulate()}>
            Simula preventivo
          </button>
          <ul>
            {simQuotes.map((q, i) => (
              <li key={i}>
                {q.label}: €{(q.amountCents / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
