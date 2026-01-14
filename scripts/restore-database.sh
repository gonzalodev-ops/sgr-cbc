#!/bin/bash
# Script de restauración de base de datos Supabase
# Uso: ./scripts/restore-database.sh backups/sgr_cbc_backup_YYYYMMDD_HHMMSS.sql.gz

# Configuración
SUPABASE_DB_HOST="${SUPABASE_DB_HOST:-db.xxxxxxxxxxxx.supabase.co}"
SUPABASE_DB_PORT="${SUPABASE_DB_PORT:-5432}"
SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-postgres}"
SUPABASE_DB_USER="${SUPABASE_DB_USER:-postgres}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: Debe especificar el archivo de respaldo"
    echo "   Uso: ./scripts/restore-database.sh backups/sgr_cbc_backup_YYYYMMDD_HHMMSS.sql.gz"
    echo ""
    echo "📋 Respaldos disponibles:"
    ls -lh backups/sgr_cbc_backup_*.sql.gz 2>/dev/null || echo "   No hay respaldos disponibles"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD no está configurada"
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esto sobrescribirá los datos actuales de la base de datos"
echo "📁 Archivo a restaurar: $BACKUP_FILE"
read -p "¿Está seguro que desea continuar? (escriba 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "❌ Restauración cancelada"
    exit 1
fi

echo "🔄 Iniciando restauración..."

# Descomprimir si es necesario
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Descomprimiendo archivo..."
    TEMP_FILE="/tmp/restore_temp_$$.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    SQL_FILE="$TEMP_FILE"
else
    SQL_FILE="$BACKUP_FILE"
fi

# Restaurar
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
    -h "$SUPABASE_DB_HOST" \
    -p "$SUPABASE_DB_PORT" \
    -U "$SUPABASE_DB_USER" \
    -d "$SUPABASE_DB_NAME" \
    -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauración completada exitosamente"
else
    echo "❌ Error durante la restauración"
fi

# Limpiar archivo temporal
if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
fi
