#!/bin/bash

# =============================================================
# Script para ejecutar tests E2E de SGR-CBC
# =============================================================

echo "🧪 SGR-CBC - Tests E2E para COLABORADOR"
echo "========================================"
echo ""

# Verificar si Playwright está instalado
if ! npx playwright --version &> /dev/null; then
    echo "📦 Instalando Playwright..."
    npm install -D @playwright/test
    npx playwright install chromium
fi

# URL del ambiente a probar
TEST_URL="${TEST_URL:-https://sgr-cbc-git-claude-consolidat-da85f8-gonzalos-projects-c2b87390.vercel.app}"

echo "🌐 URL de prueba: $TEST_URL"
echo ""

# Ejecutar tests
echo "🚀 Ejecutando tests..."
echo ""

npx playwright test tests/colaborador.spec.ts --reporter=list

# Mostrar resultados
echo ""
echo "========================================"
echo "✅ Tests completados"
echo ""
echo "Para ver el reporte visual:"
echo "  npx playwright show-report"
echo ""
echo "Para ejecutar en modo interactivo:"
echo "  npx playwright test --ui"
