# Guía de Respaldos de Base de Datos

## Resumen de Opciones

| Método | Automatizado | Costo | Recomendado para |
|--------|--------------|-------|------------------|
| Supabase Pro | ✅ Diario | $25/mes | Producción |
| Script manual | ❌ Manual | Gratis | Desarrollo/Testing |
| Cron local | ✅ Programable | Gratis | Servidor propio |
| GitHub Actions | ✅ Programable | Gratis (2000 min/mes) | CI/CD existente |

---

## Opción 1: Respaldos Automáticos de Supabase (Recomendado para Producción)

### Plan Pro ($25/mes)
- Respaldos automáticos diarios
- Retención de 7 días
- Restauración con un clic desde el dashboard

### Cómo activar:
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto `sgr-cbc`
3. Settings > Billing > Upgrade to Pro
4. Los respaldos se activan automáticamente

### Cómo restaurar:
1. Dashboard > Database > Backups
2. Seleccionar fecha del respaldo
3. Click en "Restore"

---

## Opción 2: Script Manual (Gratis)

### Requisitos
```bash
# Instalar cliente de PostgreSQL
sudo apt install postgresql-client

# O en macOS
brew install postgresql
```

### Configuración
```bash
# Obtener credenciales de Supabase Dashboard > Settings > Database
export SUPABASE_DB_HOST="db.xxxxxxxxxxxx.supabase.co"
export SUPABASE_DB_PASSWORD="tu-contraseña-de-bd"
```

### Crear respaldo
```bash
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

### Restaurar respaldo
```bash
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh backups/sgr_cbc_backup_20260114_120000.sql.gz
```

---

## Opción 3: Respaldos Automáticos con Cron (Gratis)

### En servidor Linux/Mac

```bash
# Editar crontab
crontab -e

# Agregar línea para respaldo diario a las 2:00 AM
0 2 * * * cd /ruta/al/proyecto/sgr-cbc && ./scripts/backup-database.sh >> /var/log/sgr-backup.log 2>&1
```

### Verificar que funciona
```bash
# Listar cron jobs
crontab -l

# Ver logs
tail -f /var/log/sgr-backup.log
```

---

## Opción 4: GitHub Actions (Gratis hasta 2000 min/mes)

Crear archivo `.github/workflows/backup-database.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Ejecutar diario a las 3:00 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          SUPABASE_DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
          PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
            -h "$SUPABASE_DB_HOST" \
            -p 5432 \
            -U postgres \
            -d postgres \
            --schema=public \
            -F c \
            -f "backup_$TIMESTAMP.dump"

      - name: Upload backup artifact
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ github.run_id }}
          path: backup_*.dump
          retention-days: 30
```

### Configurar secrets en GitHub:
1. Ir a Settings > Secrets and variables > Actions
2. Agregar:
   - `SUPABASE_DB_HOST`: `db.xxxxxxxxxxxx.supabase.co`
   - `SUPABASE_DB_PASSWORD`: tu contraseña

---

## Opción 5: Respaldo desde Supabase CLI

### Instalar Supabase CLI
```bash
npm install -g supabase
```

### Exportar esquema y datos
```bash
# Solo esquema (estructura)
supabase db dump --project-ref tu-project-ref > schema_backup.sql

# Esquema + datos
supabase db dump --project-ref tu-project-ref --data-only > data_backup.sql
```

---

## Recomendación según Entorno

### Desarrollo
- Script manual cuando sea necesario
- Respaldo antes de cambios importantes en schema

### Staging/Testing
- Cron job semanal
- GitHub Actions

### Producción
- **Supabase Pro** (respaldo diario automático) ✅
- Adicionalmente: GitHub Actions semanal como respaldo secundario

---

## Estructura de Archivos de Respaldo

```
sgr-cbc/
├── backups/                    # Ignorado en .gitignore
│   ├── sgr_cbc_backup_20260114_020000.sql.gz
│   ├── sgr_cbc_backup_20260115_020000.sql.gz
│   └── ...
├── scripts/
│   ├── backup-database.sh      # Script de respaldo
│   └── restore-database.sh     # Script de restauración
```

---

## Verificar Integridad del Respaldo

```bash
# Ver contenido del respaldo (sin restaurar)
gunzip -c backups/sgr_cbc_backup_*.sql.gz | head -100

# Contar tablas en el respaldo
gunzip -c backups/sgr_cbc_backup_*.sql.gz | grep "CREATE TABLE" | wc -l
```

---

## En Caso de Emergencia

### Si la base de datos se corrompe:
1. NO entrar en pánico
2. Detener la aplicación (evitar más escrituras)
3. Identificar el respaldo más reciente
4. Restaurar usando el script o desde Supabase Dashboard

### Contacto de soporte Supabase:
- support@supabase.io
- [Status Page](https://status.supabase.com)

---

**Última actualización:** Enero 2026
