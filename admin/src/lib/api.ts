/** In dev usa path relativi → proxy Vite (:5174 → :4000), cookie same-origin. */
export const apiUrl = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:4000')

const apiOrigin =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000'

function networkErrorMessage(): string {
  return `Impossibile raggiungere il backend (${apiOrigin}). Verifica che il server API sia avviato (npm run dev:server) e che VITE_API_URL sia corretto.`
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${apiUrl}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new Error(networkErrorMessage())
  }
}

async function parseError(res: Response): Promise<string> {
  let msg = await res.text()
  try {
    const j = JSON.parse(msg) as { error?: { message?: string } }
    msg = j.error?.message ?? msg
  } catch {
    /* testo grezzo */
  }
  return msg || `HTTP ${res.status}`
}

export async function adminAuthApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(path, init)
  if (!res.ok) throw new Error(await parseError(res))
  const json = (await res.json()) as { data: T }
  return json.data
}

export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(path, init)
  if (!res.ok) throw new Error(await parseError(res))
  const json = (await res.json()) as { data: T }
  return json.data
}

/** Upload multipart (non impostare Content-Type: il browser aggiunge il boundary). */
export async function adminApiFormData<T>(path: string, formData: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${apiUrl}/api/v1${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
  } catch {
    throw new Error(networkErrorMessage())
  }
  if (!res.ok) throw new Error(await parseError(res))
  const json = (await res.json()) as { data: T }
  return json.data
}
