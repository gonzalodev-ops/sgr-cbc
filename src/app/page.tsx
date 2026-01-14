import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-4 text-white">
      {/* Hero Section */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          SGR CBC
        </h1>
        <p className="text-xl text-blue-200 mb-2">
          Sistema de Gestión de Resultados
        </p>
        <p className="text-slate-300 mb-8">
          Transformando la gestión de tiempo en gestión de resultados
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/30"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-colors"
          >
            Ver Demo
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold mb-2">Tablero Maestro</h3>
          <p className="text-sm text-slate-300">Vista unificada de resultados por colaborador, tribu, cliente y proceso</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold mb-2">Flujos Optimizados</h3>
          <p className="text-sm text-slate-300">Nómina e IMSS con pasos ponderados y seguimiento en tiempo real</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold mb-2">Scoring por RFC</h3>
          <p className="text-sm text-slate-300">Medición de carga y resultados basada en régimen y tallas</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-slate-400">
        CBC © 2026 - Sistema de Gestión de Resultados
      </p>
    </div>
  )
}
