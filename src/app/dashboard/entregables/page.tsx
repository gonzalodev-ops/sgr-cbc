import { FileCheck } from 'lucide-react'

export default function EntregablesPage() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <FileCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Entregables</h1>
                        <p className="text-slate-500">Catálogo de servicios y documentos</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Vista en Construcción</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    Aquí podrás gestionar los tipos de entregables, periodicidad y templates de documentos.
                </p>
            </div>
        </div>
    )
}
