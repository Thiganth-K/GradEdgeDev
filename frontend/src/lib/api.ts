export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export async function getJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        ok: false,
        status: res.status,
        error: text || `Request failed (${res.status})`,
      }
    }

    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: message }
  }
}

export async function postJson<TResponse, TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
  init?: RequestInit,
): Promise<ApiResult<TResponse>> {
  return getJson<TResponse>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export async function putJson<TResponse, TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
  init?: RequestInit,
): Promise<ApiResult<TResponse>> {
  return getJson<TResponse>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export async function deleteJson<TResponse>(path: string, init?: RequestInit): Promise<ApiResult<TResponse>> {
  return getJson<TResponse>(path, { method: 'DELETE', ...init })
}
