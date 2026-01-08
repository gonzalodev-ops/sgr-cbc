const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../public/templates');

if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// 1. Clientes Template - Professional Headers
const clientesHeaders = [
    'Nombre del Cliente',
    'RFC',
    'Tipo Persona (PF/PM)',
    'Régimen Fiscal (Código)',
    'Talla Fiscal (XS-XL)',
    'Talla Nómina (XS-XL)',
    'Talla IMSS (XS-XL)',
    'Tribu / Equipo'
];

const clientesData = [
    [
        'Empresa Ejemplo S.A.',
        'EEM010101ABC',
        'PM',
        '601',
        'M',
        'L',
        'S',
        'Isidora'
    ],
    [
        'Juan Perez',
        'PEJU800101HDF',
        'PF',
        '612',
        'S',
        'XS',
        'M',
        'Noelia'
    ]
];

const clientesWS = XLSX.utils.aoa_to_sheet([clientesHeaders, ...clientesData]);
const clientesWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(clientesWB, clientesWS, 'Clientes');
XLSX.writeFile(clientesWB, path.join(TEMPLATES_DIR, 'clientes_template.xlsx'));

// 2. Usuarios Template - Professional Headers
const usuariosHeaders = [
    'Nombre de la Tribu',
    'Nombre Completo',
    'Correo Electrónico',
    'Rol (LIDER/AUXILIAR_A/B/C)'
];

const usuariosData = [
    [
        'Isidora',
        'Ana Garcia',
        'ana.garcia@ejemplo.com',
        'LIDER'
    ],
    [
        'Isidora',
        'Carlos Lopez',
        'carlos.lopez@ejemplo.com',
        'AUXILIAR_A'
    ]
];

const usuariosWS = XLSX.utils.aoa_to_sheet([usuariosHeaders, ...usuariosData]);
const usuariosWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(usuariosWB, usuariosWS, 'Usuarios');
XLSX.writeFile(usuariosWB, path.join(TEMPLATES_DIR, 'usuarios_template.xlsx'));

console.log('Professional templates generated successfully in public/templates/');
