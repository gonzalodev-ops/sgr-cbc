import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Map of allowed template files for security
const ALLOWED_TEMPLATES: { [key: string]: string } = {
    'clientes_template.xlsx': 'Plantilla_Clientes.xlsx',
    'usuarios_template.xlsx': 'Plantilla_Usuarios.xlsx',
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params

    // Security check: only allow specific template files
    if (!ALLOWED_TEMPLATES[filename]) {
        return NextResponse.json(
            { error: 'Archivo no encontrado' },
            { status: 404 }
        )
    }

    const filePath = join(process.cwd(), 'public', 'templates', filename)

    // Check if file exists
    if (!existsSync(filePath)) {
        return NextResponse.json(
            { error: 'Archivo no encontrado' },
            { status: 404 }
        )
    }

    try {
        const fileBuffer = await readFile(filePath)
        const downloadFilename = ALLOWED_TEMPLATES[filename]

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${downloadFilename}"`,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        })
    } catch (error) {
        console.error('Error reading template file:', error)
        return NextResponse.json(
            { error: 'Error al leer el archivo' },
            { status: 500 }
        )
    }
}
