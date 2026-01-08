const XLSX = require('xlsx');
const path = require('path');

const templates = [
    'clientes_template.xlsx',
    'usuarios_template.xlsx'
];

templates.forEach(t => {
    const filePath = path.join(__dirname, '../public/templates', t);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`--- ${t} ---`);
    console.log(JSON.stringify(data[0], null, 2));
});
