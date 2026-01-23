'use client'

import { useState, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react'

interface ImportResult {
    success: boolean
    message: string
    data?: Record<string, unknown>[]
    errors?: string[]
}

interface ExcelImportProps {
    onImport: (data: Record<string, unknown>[], tipo: 'clientes' | 'usuarios') => Promise<void>
    tipo: 'clientes' | 'usuarios'
}

export function ExcelImport({ onImport, tipo }: ExcelImportProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null)

    const HEADER_MAP: Record<string, string> = {
        // Clientes
        'Nombre del Cliente': 'cliente_nombre',
        'RFC': 'rfc',
        'Tipo Persona (PF/PM)': 'tipo_persona',
        'Régimen Fiscal (Código)': 'regimen',
        'Talla Fiscal (XS-XL)': 'talla_fiscal',
        'Talla Nómina (XS-XL)': 'talla_nomina',
        'Talla IMSS (XS-XL)': 'talla_imss',
        'Tribu / Equipo': 'equipo',
        // Usuarios
        'Nombre de la Tribu': 'equipo_nombre',
        'Nombre Completo': 'usuario_nombre',
        'Correo Electrónico': 'email',
        'Rol (LIDER/AUXILIAR_A/B/C)': 'rol'
    }

    const expectedHeaders = tipo === 'clientes'
        ? ['Nombre del Cliente', 'RFC', 'Tipo Persona (PF/PM)', 'Régimen Fiscal (Código)', 'Talla Fiscal (XS-XL)', 'Talla Nómina (XS-XL)', 'Talla IMSS (XS-XL)', 'Tribu / Equipo']
        : ['Nombre de la Tribu', 'Nombre Completo', 'Correo Electrónico', 'Rol (LIDER/AUXILIAR_A/B/C)']

    const processFile = useCallback(async (file: File) => {
        setLoading(true)
        setResult(null)
        setPreview(null)

        try {
            let rawData: Record<string, unknown>[] = []
            let headers: string[] = []

            if (file.name.endsWith('.csv')) {
                // Parse CSV manually
                const text = await file.text()
                const lines = text.split(/\r?\n/).filter(line => line.trim())

                if (lines.length === 0) {
                    setResult({
                        success: false,
                        message: 'El archivo está vacío',
                        errors: ['No se encontraron datos']
                    })
                    setLoading(false)
                    return
                }

                // Parse CSV header
                headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))

                // Parse CSV rows
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
                    const rowData: Record<string, unknown> = {}
                    headers.forEach((header, index) => {
                        if (header && values[index] !== undefined) {
                            rowData[header] = values[index]
                        }
                    })
                    if (Object.keys(rowData).length > 0) {
                        rawData.push(rowData)
                    }
                }
            } else {
                // Parse Excel files with ExcelJS
                const buffer = await file.arrayBuffer()
                const workbook = new ExcelJS.Workbook()
                await workbook.xlsx.load(buffer)

                const worksheet = workbook.worksheets[0]
                if (!worksheet || worksheet.rowCount === 0) {
                    setResult({
                        success: false,
                        message: 'El archivo está vacío',
                        errors: ['No se encontraron datos en la primera hoja']
                    })
                    setLoading(false)
                    return
                }

                // Get headers from first row
                const headerRow = worksheet.getRow(1)
                headerRow.eachCell((cell, colNumber) => {
                    headers[colNumber - 1] = String(cell.value || '')
                })

                // Convert rows to JSON
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return // Skip header row
                    const rowData: Record<string, unknown> = {}
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber - 1]
                        if (header) {
                            rowData[header] = cell.value
                        }
                    })
                    if (Object.keys(rowData).length > 0) {
                        rawData.push(rowData)
                    }
                })
            }

            if (headers.length === 0) {
                setResult({
                    success: false,
                    message: 'El archivo está vacío',
                    errors: ['No se encontraron encabezados']
                })
                setLoading(false)
                return
            }

            if (rawData.length === 0) {
                setResult({
                    success: false,
                    message: 'El archivo está vacío',
                    errors: ['No se encontraron datos en la primera hoja']
                })
                setLoading(false)
                return
            }

            // Validar headers
            const fileHeaders = headers
            const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h))

            if (missingHeaders.length > 0) {
                // Si no encuentra los profesionales, intentar con los internos (para backward compatibility)
                const internalKeys = tipo === 'clientes'
                    ? ['cliente_nombre', 'rfc', 'tipo_persona', 'regimen', 'talla_fiscal', 'talla_nomina', 'talla_imss', 'equipo']
                    : ['equipo_nombre', 'usuario_nombre', 'email', 'rol']

                const missingInternal = internalKeys.filter(k => !fileHeaders.includes(k))

                if (missingInternal.length > 0) {
                    setResult({
                        success: false,
                        message: 'Faltan columnas obligatorias',
                        errors: missingHeaders.map(h => `Falta columna: ${h}`)
                    })
                    setLoading(false)
                    return
                }
            }

            // Mapear headers profesionales a llaves internas
            const processedData = rawData.map(row => {
                const newRow: Record<string, unknown> = {}
                Object.entries(row).forEach(([key, value]) => {
                    const internalKey = HEADER_MAP[key] || key
                    newRow[internalKey] = value
                })
                return newRow
            })

            // Mostrar preview
            setPreview(processedData.slice(0, 5))
            setResult({
                success: true,
                message: `${processedData.length} registros listos para importar`,
                data: processedData
            })
        } catch (error) {
            setResult({
                success: false,
                message: 'Error al procesar el archivo',
                errors: [(error as Error).message]
            })
        }

        setLoading(false)
    }, [tipo, expectedHeaders])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            processFile(file)
        } else {
            setResult({
                success: false,
                message: 'Formato de archivo no soportado',
                errors: ['Por favor sube un archivo .xlsx, .xls o .csv']
            })
        }
    }, [processFile])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const handleImport = async () => {
        if (!result?.data) return

        setLoading(true)
        try {
            await onImport(result.data, tipo)
            setResult({
                success: true,
                message: `¡${result.data.length} registros importados exitosamente!`
            })
            setPreview(null)
        } catch (error) {
            setResult({
                success: false,
                message: 'Error al importar',
                errors: [(error as Error).message]
            })
        }
        setLoading(false)
    }

    const clearResult = () => {
        setResult(null)
        setPreview(null)
    }

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                    }`}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`file-upload-${tipo}`}
                />

                <label htmlFor={`file-upload-${tipo}`} className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                        {loading ? (
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileSpreadsheet className="text-blue-600" size={32} />
                            </div>
                        )}

                        <div>
                            <p className="font-medium text-slate-700">
                                {loading ? 'Procesando...' : 'Arrastra tu archivo Excel aquí'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                o haz clic para seleccionar
                            </p>
                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                            Columnas esperadas: {expectedHeaders.join(', ')}
                        </p>
                    </div>
                </label>
            </div>

            {/* Result Message */}
            {result && (
                <div className={`rounded-lg p-4 flex items-start gap-3 ${result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    {result.success ? (
                        <CheckCircle className="text-green-600 mt-0.5" size={20} />
                    ) : (
                        <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    )}

                    <div className="flex-1">
                        <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                            {result.message}
                        </p>
                        {result.errors && result.errors.length > 0 && (
                            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>

                    <button onClick={clearResult} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Preview Table */}
            {preview && preview.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-700">
                            Vista previa (primeros 5 registros)
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    {Object.keys(preview[0]).map(key => (
                                        <th key={key} className="px-4 py-2 text-left font-medium text-slate-600">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {preview.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val, j) => (
                                            <td key={j} className="px-4 py-2 text-slate-700">
                                                {String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            onClick={clearResult}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Importar {result?.data?.length} registros
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
