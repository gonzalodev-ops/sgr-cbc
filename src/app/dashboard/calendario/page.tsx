import { Calendar } from 'lucide-react'

export default function CalendarioPage() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Calendario</h1>
                        <p className="text-slate-500">Agenda fiscal y fechas límite</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Vista en Construcción</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    Vista de calendario mensual/semanal con los vencimientos de obligaciones fiscales.
                </p>
            </div>
        </div>
    )
}
