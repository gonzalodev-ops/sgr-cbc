'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// Helper to create client only on client-side
function getSupabaseClient() {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [nombre, setNombre] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Lazy initialization - only creates client on client-side
    const supabase = useMemo(() => getSupabaseClient(), [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) return
        setError(null)
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message)
            setLoading(false)
            return
        }

        router.push('/dashboard')
        router.refresh()
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) return
        setError(null)
        setLoading(true)

        if (!nombre && isRegister) {
            setError('El nombre es requerido')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: nombre,
                    rol: 'COLABORADOR'
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setError('Revisa tu correo para confirmar tu cuenta')
        setLoading(false)
        setIsRegister(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">SGR CBC</h1>
                    <p className="text-blue-200">Sistema de Gestión de Resultados</p>
                </div>

                {/* Login/Register Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </h2>

                    {error && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${error.includes('Revisa')
                            ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                            : 'bg-red-500/20 border border-red-500/30 text-red-200'
                            }`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={isRegister ? handleSignUp : handleLogin} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Juan Pérez"
                                    required={isRegister}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/30"
                        >
                            {loading ? 'Procesando...' : (isRegister ? 'Registrarse' : 'Entrar')}
                        </button>
                    </form>

                    {/* Toggle Link */}
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister)
                                setError(null)
                            }}
                            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                        >
                            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crear una'}
                        </button>
                    </div>

                    {/* Divider */}
                    {!isRegister && (
                        <>
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-white/20"></div>
                                <span className="px-4 text-sm text-white/50">o continúa con</span>
                                <div className="flex-1 border-t border-white/20"></div>
                            </div>

                            <button
                                type="button"
                                className="w-full py-3 bg-white/20 text-white/50 font-medium rounded-lg transition-colors flex items-center justify-center gap-3 cursor-not-allowed"
                                disabled
                            >
                                <svg className="w-5 h-5 opacity-50" viewBox="0 0 21 21" fill="none">
                                    <path d="M0 0h10v10H0V0z" fill="#F25022" />
                                    <path d="M11 0h10v10H11V0z" fill="#7FBA00" />
                                    <path d="M0 11h10v10H0V11z" fill="#00A4EF" />
                                    <path d="M11 11h10v10H11V11z" fill="#FFB900" />
                                </svg>
                                Microsoft (Próximamente)
                            </button>
                        </>
                    )}

                    <p className="text-center text-white/50 text-sm mt-6">
                        ¿Problemas para acceder? Contacta al administrador.
                    </p>
                </div>
            </div>
        </div>
    )
}
