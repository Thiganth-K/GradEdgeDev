import { useState, type FormEvent } from 'react'
import { postJson } from '../lib/api'

type Props = {
	onLoginSuccess: (username: string, role?: string) => void
}

type LoginResponse = {
	ok: boolean
	message?: string
	redirect?: string
}

export default function LoginPage({ onLoginSuccess }: Props) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | undefined>(undefined)

	async function onSubmit(e: FormEvent) {
		e.preventDefault()
		setError(undefined)
		setLoading(true)

		const result = await postJson<LoginResponse, { username: string; password: string }>(
			'/api/auth/login',
			{ username, password },
		)

		setLoading(false)

		if (!result.ok) {
			// HTTP-level error (e.g. 401) — show message if available
			setError(result.error || `Request failed (${(result as any).status || 'error'})`)
			return
		}

		const data = (result as any).data as LoginResponse
		if (!data || !data.ok) {
			setError(data?.message || 'Invalid credentials')
			return
		}

		const role = data.role || 'admin'

		const u = username.trim()
		if (u) {
			localStorage.setItem('logged_in', 'true')
			localStorage.setItem('username', u)
			localStorage.setItem('role', role)
		}

		onLoginSuccess(u || 'admin', role)
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
			<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">GradEdgeDev</h1>
					<p className="text-sm text-slate-600">Enter your GradEdgeDev username and password to get started.</p>
				</div>

				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium text-slate-700">GradEdgeDev username</label>
						<input
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter admin username"
							autoComplete="username"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium text-slate-700">GradEdgeDev password</label>
						<input
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter admin password"
							type="password"
							autoComplete="current-password"
							required
						/>
					</div>

					{error ? (
						<div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
					) : null}

					<button
						className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
						type="submit"
						disabled={loading}
					>
						{loading ? 'Getting started…' : 'Get started'}
					</button>
				</form>

				<p className="mt-4 text-xs text-slate-500">
					Backend: <span className="font-mono">POST /api/auth/login</span>
				</p>
			</div>
		</main>
	)
}
