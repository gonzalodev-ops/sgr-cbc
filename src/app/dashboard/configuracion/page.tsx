'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { ExcelImport } from '@/components/import/ExcelImport'
import { Download, Building2, Users, FileText, Settings, Package, Database, AlertCircle, Clock } from 'lucide-react'
import dynamicImport from 'next/dynamic'

// Importar componentes dinámicamente para evitar problemas de SSR
const TabClientes = dynamicImport(() => import('@/components/config/TabClientes'), { ssr: false })
const TabColaboradores = dynamicImport(() => import('@/components/config/TabColaboradores'), { ssr: false })
const TabObligaciones = dynamicImport(() => import('@/components/config/TabObligaciones'), { ssr: false })
const TabProcesos = dynamicImport(() => import('@/components/config/TabProcesos'), { ssr: false })
const TabServicios = dynamicImport(() => import('@/components/config/TabServicios'), { ssr: false })
const TabSLA = dynamicImport(() => import('@/components/config/TabSLA'), { ssr: false })
const TabDatos = dynamicImport(() => import('@/components/config/TabDatos'), { ssr: false })

type TabType = 'clientes' | 'colaboradores' | 'obligaciones' | 'procesos' | 'servicios' | 'sla' | 'datos'

const tabs = [
    { id: 'clientes' as const, label: 'Clientes', icon: Building2, color: 'emerald' },
    { id: 'colaboradores' as const, label: 'Colaboradores', icon: Users, color: 'blue' },
    { id: 'obligaciones' as const, label: 'Catalogo Fiscal', icon: FileText, color: 'purple' },
    { id: 'procesos' as const, label: 'Procesos', icon: Settings, color: 'teal' },
    { id: 'servicios' as const, label: 'Servicios/Tallas', icon: Package, color: 'indigo' },
    { id: 'sla' as const, label: 'SLA', icon: Clock, color: 'rose' },
    { id: 'datos' as const, label: 'Base de Datos', icon: Database, color: 'amber' },
]

export default function ConfiguracionPage() {
    const [activeTab, setActiveTab] = useState<TabType>('clientes')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                <p className="text-slate-700 mt-1">Gestión completa de datos maestros del sistema</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
                                ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50/50`
                                : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            style={activeTab === tab.id ? { borderBottomColor: getColor(tab.color), color: getColor(tab.color) } : {}}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'clientes' && <TabClientes />}
                    {activeTab === 'colaboradores' && <TabColaboradores />}
                    {activeTab === 'obligaciones' && <TabObligaciones />}
                    {activeTab === 'procesos' && <TabProcesos />}
                    {activeTab === 'servicios' && <TabServicios />}
                    {activeTab === 'sla' && <TabSLA />}
                    {activeTab === 'datos' && <TabDatos />}
                </div>
            </div>
        </div>
    )
}

function getColor(name: string): string {
    const colors: Record<string, string> = {
        emerald: '#10b981',
        blue: '#3b82f6',
        purple: '#8b5cf6',
        teal: '#14b8a6',
        indigo: '#6366f1',
        rose: '#f43f5e',
        amber: '#f59e0b'
    }
    return colors[name] || '#6b7280'
}
