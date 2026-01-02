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

// -----------------------------
// Role-aware API helpers
// -----------------------------

// Encode a single path segment safely
function enc(seg: string) {
  return encodeURIComponent(seg)
}

// Common header helpers
function withHeaders(init: RequestInit | undefined, headers: Record<string, string>): RequestInit {
  return {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      ...headers,
    },
  }
}

// Admin API
export const adminApi = {
  me: () => getJson<{ username: string; greeting?: string }>(`/api/admin/me`),
  logs: () => getJson<{ logs: Array<{ username: string; role: string; action: string; ts: string; extra?: unknown }> }>(`/api/admin/logs`),
}

// Institutional API
export const institutionalApi = {
  listUsers: () => getJson<any>(`/api/institutional`),
  createOrUpdateUser: (body: Record<string, unknown>) =>
    postJson<any, Record<string, unknown>>(`/api/institutional`, body, withHeaders(undefined, { 'x-requested-by': 'institutional' })),
  deleteUser: (username: string) =>
    deleteJson<any>(`/api/institutional/${enc(username)}`),

  // MCQ Tests
  createTest: (
    institutionalId: string,
    body: { type: 'aptitude' | 'technical' | 'psychometric'; title?: string },
  ) => postJson<any, typeof body>(`/api/institutional/${enc(institutionalId)}/tests`, body, withHeaders(undefined, { 'x-requested-by': 'institutional' })),

  listTests: (institutionalId: string) => getJson<{ tests: any[] }>(`/api/institutional/${enc(institutionalId)}/tests`),

  // list faculty and batches for assignment UI
  listFaculty: (institutionalId: string) => getJson<{ ok: boolean; data: any[] }>(`/api/institutional/${enc(institutionalId)}/faculty`),
  listBatches: (institutionalId: string) => getJson<{ ok: boolean; data: any[] }>(`/api/institutional/${enc(institutionalId)}/batches`),

  assignTest: (
    institutionalId: string,
    testId: string,
    body: { faculty_ids?: string[]; batch_codes?: string[]; student_ids?: string[] },
  ) => postJson<any, typeof body>(
    `/api/institutional/${enc(institutionalId)}/tests/${enc(testId)}/assign`,
    body,
    withHeaders(undefined, { 'x-requested-by': 'institutional' }),
  ),
  deleteTest: (institutionalId: string, testId: string) =>
    deleteJson<any>(`/api/institutional/${enc(institutionalId)}/tests/${enc(testId)}`, withHeaders(undefined, { 'x-requested-by': 'institutional' })),
}

// Faculty API
export const facultyApi = {
  // Batches
  getBatches: (facultyId: string) => getJson<{ batches: any[] }>(`/api/faculty/${enc(facultyId)}/batches`),
  createBatch: (
    facultyId: string,
    body: { batch_code: string; department?: string; year?: string; section?: string },
  ) => postJson<any, typeof body>(`/api/faculty/${enc(facultyId)}/batches`, body),
  assignStudentToBatch: (facultyId: string, batchCode: string, username: string) =>
    postJson<any, { username: string }>(`/api/faculty/${enc(facultyId)}/batches/${enc(batchCode)}/assign`, { username }),

  // Students
  getStudents: (facultyId: string) => getJson<{ students: any[] }>(`/api/faculty/${enc(facultyId)}/students`),

  // Announcements
  getAnnouncements: (facultyId: string) => getJson<{ announcements: any[] }>(`/api/faculty/${enc(facultyId)}/announcements`),
  createAnnouncement: (
    facultyId: string,
    body: { title: string; content: string; target_batches: string[]; important?: boolean },
  ) => postJson<any, typeof body>(`/api/faculty/${enc(facultyId)}/announcements`, body),

  // MCQ Tests (viewing for faculty)
  listTests: (facultyId: string) => getJson<{ tests: any[] }>(`/api/faculty/${enc(facultyId)}/tests`),
  getTestResults: (facultyId: string, testId: string) => getJson<{ submissions: any[] }>(`/api/faculty/${enc(facultyId)}/tests/${enc(testId)}/results`),
}

// Student API
export const studentApi = {
  listTests: (username: string) => getJson<{ tests: any[] }>(`/api/student/${enc(username)}/tests`),
  getTest: (username: string, testId: string) => getJson<{ test: any }>(`/api/student/${enc(username)}/tests/${enc(testId)}`),
  submitTest: (
    username: string,
    testId: string,
    body: { answers: Array<{ id: string; answer: string }> },
  ) => postJson<{ ok: boolean; score?: number; detail?: any }, typeof body>(`/api/student/${enc(username)}/tests/${enc(testId)}/submit`, body),
  getAnnouncements: (username: string) => getJson<{ ok: boolean; data: Array<{ id: string; title: string; description: string; date: string; category: string; test_id?: string }> }>(`/api/student/${enc(username)}/announcements`),
}

