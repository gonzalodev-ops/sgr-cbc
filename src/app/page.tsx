import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] via-[#34588C] to-[#264066] flex flex-col items-center justify-center p-4 text-white">
      {/* Hero Section */}
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <Image
            src="/cb-logo-flat.svg"
            alt="Calderón & Berges"
            width={280}
            height={80}
            className="brightness-0 invert"
            priority
          />
        </div>
        <p className="text-xl text-[#F7BE8A] mb-2">
          Sistema de Gestión de Resultados
        </p>
        <p className="text-slate-300 mb-8">
          Transformando la gestión de tiempo en gestión de resultados
        </p>

        {/* CTA Button */}
        <Link
          href="/login"
          className="inline-block px-10 py-4 bg-[#F19F53] hover:bg-[#D88A3D] rounded-lg font-semibold transition-colors shadow-lg shadow-[#F19F53]/30 text-lg"
        >
          Iniciar Sesión
        </Link>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold mb-2 text-[#F7BE8A]">Tablero Maestro</h3>
          <p className="text-sm text-slate-300">Vista unificada de resultados por colaborador, tribu, cliente y proceso</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold mb-2 text-[#F7BE8A]">Flujos Optimizados</h3>
          <p className="text-sm text-slate-300">Nómina e IMSS con pasos ponderados y seguimiento en tiempo real</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold mb-2 text-[#F7BE8A]">Scoring por RFC</h3>
          <p className="text-sm text-slate-300">Medición de carga y resultados basada en régimen y tallas</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-slate-400">
        Calderón & Berges © 2026 - Sistema de Gestión de Resultados
      </p>
    </div>
  )
}
