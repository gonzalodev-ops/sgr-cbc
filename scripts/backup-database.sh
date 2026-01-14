#!/bin/bash
# Script de respaldo de base de datos Supabase
# Uso: ./scripts/backup-database.sh

# Configuración - Obtener de Supabase Dashboard > Settings > Database
SUPABASE_DB_HOST="${SUPABASE_DB_HOST:-db.xxxxxxxxxxxx.supabase.co}"
SUPABASE_DB_PORT="${SUPABASE_DB_PORT:-5432}"
SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-postgres}"
SUPABASE_DB_USER="${SUPABASE_DB_USER:-postgres}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

# Directorio de respaldos
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con fecha
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sgr_cbc_backup_$TIMESTAMP.sql"

echo "🔄 Iniciando respaldo de base de datos..."
echo "📅 Fecha: $(date)"
echo "📁 Archivo: $BACKUP_FILE"

# Verificar que pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump no está instalado"
    echo "   Instalar con: sudo apt install postgresql-client"
    exit 1
fi

# Verificar que tenemos la contraseña
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD no está configurada"
    echo "   Configurar con: export SUPABASE_DB_PASSWORD='tu-contraseña'"
    echo "   La contraseña está en: Supabase Dashboard > Settings > Database > Connection string"
    exit 1
fi

# Ejecutar pg_dump
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
    -h "$SUPABASE_DB_HOST" \
    -p "$SUPABASE_DB_PORT" \
    -U "$SUPABASE_DB_USER" \
    -d "$SUPABASE_DB_NAME" \
    -F p \
    --no-owner \
    --no-acl \
    --schema=public \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Comprimir el respaldo
    gzip "$BACKUP_FILE"
    COMPRESSED_FILE="$BACKUP_FILE.gz"
    SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

    echo "✅ Respaldo completado exitosamente"
    echo "📦 Archivo: $COMPRESSED_FILE"
    echo "📊 Tamaño: $SIZE"

    # Limpiar respaldos antiguos (mantener últimos 7)
    echo "🧹 Limpiando respaldos antiguos..."
    ls -t "$BACKUP_DIR"/sgr_cbc_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm

    echo "📋 Respaldos disponibles:"
    ls -lh "$BACKUP_DIR"/sgr_cbc_backup_*.sql.gz 2>/dev/null
else
    echo "❌ Error al crear el respaldo"
    exit 1
fi
