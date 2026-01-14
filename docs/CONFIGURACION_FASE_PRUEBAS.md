# Configuración para Fase de Pruebas - SGR CBC

Este documento detalla la configuración específica del sistema para la fase de pruebas beta.

---

## 1. Regímenes Fiscales y Pesos por Entregable

### 1.1 Clave SAT 601 - Régimen General de Ley Personas Morales

**Tipo:** Persona Moral (PM)

| Entregable / Obligación | Peso % |
|-------------------------|--------|
| IVA | 5 |
| RET IVA | 5 |
| RET ISR | 5 |
| ISR | 5 |
| DIOT | 7 |
| RET ISR sueldos y salarios | 5 |
| ISN | 4 |
| RET IC honorarios | 4 |
| IMSS | 15 |
| Nóminas (PTU, Aguinaldo) | 10 |
| Facturación | 15 |
| Contabilidad electrónica | 20 |
| **TOTAL** | **100** |

---

### 1.2 Clave SAT 612 - Personas Físicas con Actividades Empresariales y Profesionales

**Tipo:** Persona Física (PF)

| Entregable / Obligación | Peso % |
|-------------------------|--------|
| ISR | 8 |
| IVA | 8 |
| RET ISR sueldos y salarios | 5 |
| DIOT | 7 |
| ISN | 4 |
| IC | 4 |
| ISH | 4 |
| IMSS | 15 |
| Nóminas (PTU, Aguinaldo) | 10 |
| Facturación | 15 |
| Contabilidad electrónica | 20 |
| **TOTAL** | **100** |

---

### 1.3 Clave SAT 626-PF - Régimen Simplificado de Confianza (RESICO PF)

**Tipo:** Persona Física (PF)

| Entregable / Obligación | Peso % |
|-------------------------|--------|
| ISR | 10 |
| IVA | 10 |
| RET ISR sueldos y salarios | 5 |
| DIOT | 10 |
| ISN | 5 |
| IC | 5 |
| ISH | 5 |
| IMSS | 15 |
| Nóminas (PTU, Aguinaldo) | 10 |
| Facturación | 25 |
| **TOTAL** | **100** |

---

### 1.4 Clave SAT 626-PM - Régimen Simplificado de Confianza (RESICO PM)

**Tipo:** Persona Moral (PM)

> **Nota:** En el catálogo SAT, RESICO usa la misma clave 626. En el sistema se separa PF/PM como registros distintos: `626-PF` y `626-PM`.

| Entregable / Obligación | Peso % |
|-------------------------|--------|
| IVA | 5 |
| ISR | 5 |
| RET de ISR | 5 |
| RET de IVA | 5 |
| DIOT | 10 |
| RET ISR sueldos y salarios | 5 |
| ISN | 5 |
| IMSS | 15 |
| Nóminas (PTU, Aguinaldo) | 10 |
| Facturación | 15 |
| Contabilidad electrónica | 20 |
| **TOTAL** | **100** |

---

### 1.5 Clave SAT 625 - Régimen de Plataformas Tecnológicas

**Tipo:** Persona Física (PF)

| Entregable / Obligación | Peso % |
|-------------------------|--------|
| IVA | 10 |
| ISR | 10 |
| DIOT | 10 |
| RET ISR sueldos y salarios | 5 |
| ISN | 5 |
| ISH | 5 |
| IMSS | 15 |
| Nóminas (PTU, Aguinaldo) | 10 |
| Facturación | 30 |
| **TOTAL** | **100** |

---

## 2. Tallas (Ponderación Relativa)

**Regla:** Mediana = 100 (baseline)

| Talla | Ponderación | Factor |
|-------|-------------|--------|
| Extra chica | 50 | 0.50 |
| Chica | 75 | 0.75 |
| Mediana | 100 | 1.00 |
| Grande | 150 | 1.50 |
| Extra grande | 200 | 2.00 |

### Ejemplo de Cálculo de Puntos

```
Puntos = Peso del Entregable × Factor de Talla

Ejemplo: ISR (5%) para cliente talla Grande (1.5)
Puntos = 5 × 1.5 = 7.5 puntos
```

---

## 3. Procesos Operativos

**Regla:** Por proceso, la suma de ponderaciones debe ser = 100%

### 3.1 Nómina - Recurrente (Total: 100%)

| # | Paso | Peso % | Tipo Colaborador |
|---|------|--------|------------------|
| 1 | Consulta de incidencias | 30 | C |
| 2 | Captura de incidencias | 30 | C |
| 3 | Procesar nómina | 30 | C |
| 4 | Timbrar nómina | 5 | C |
| 5 | Enviar nómina | 5 | C |
| | **TOTAL** | **100** | |

---

### 3.2 IMSS - Recurrente (Total: 100%)

| # | Paso | Peso % | Tipo Colaborador |
|---|------|--------|------------------|
| 1 | Captura de mov. ante IDSE | 20 | B |
| 2 | Captura de mov. ante Nominax | 15 | B |
| 3 | Captura de mov. ante SUA | 15 | B |
| 4 | Descarga de IDSE | 15 | C |
| 5 | Descarga de SIPARE | 5 | C |
| 6 | Descarga de reportes de Nominax | 5 | C |
| 7 | Cotejo entre IDSE, SIPARE, SUA, Nominax | 25 | A |
| | **TOTAL** | **100** | |

---

### 3.3 Proceso Genérico (Total: 100%)

Para las demás obligaciones (ISR, IVA, DIOT, Facturación, etc.) que quedan fuera del alcance de la primera fase.

| # | Paso | Peso % | Tipo Colaborador |
|---|------|--------|------------------|
| 1 | Recopilación de información | 20 | C |
| 2 | Procesamiento | 40 | B |
| 3 | Revisión y validación | 25 | A |
| 4 | Presentación/Envío | 15 | C |
| | **TOTAL** | **100** | |

---

## 4. Tipos de Colaborador

| Tipo | Nivel | Descripción |
|------|-------|-------------|
| A | Expert | Tareas de validación y revisión final |
| B | Intermediate | Tareas de procesamiento y captura compleja |
| C | Junior | Tareas operativas, descarga y envío |

---

## 5. Matriz de Obligaciones por Régimen

| Obligación | 601 (PM) | 612 (PF) | 626-PF | 626-PM | 625 |
|------------|:--------:|:--------:|:------:|:------:|:---:|
| IVA | 5 | 8 | 10 | 5 | 10 |
| ISR | 5 | 8 | 10 | 5 | 10 |
| RET IVA | 5 | - | - | 5 | - |
| RET ISR | 5 | - | - | 5 | - |
| RET ISR sueldos | 5 | 5 | 5 | 5 | 5 |
| DIOT | 7 | 7 | 10 | 10 | 10 |
| ISN | 4 | 4 | 5 | 5 | 5 |
| IC | - | 4 | 5 | - | - |
| ISH | - | 4 | 5 | - | 5 |
| RET IC honorarios | 4 | - | - | - | - |
| IMSS | 15 | 15 | 15 | 15 | 15 |
| Nóminas | 10 | 10 | 10 | 10 | 10 |
| Facturación | 15 | 15 | 25 | 15 | 30 |
| Contab. Electrónica | 20 | 20 | - | 20 | - |
| **TOTAL** | **100** | **100** | **100** | **100** | **100** |

---

## 6. Archivo de Seed Data

Para cargar esta configuración en la base de datos, ejecutar:

```sql
-- Archivo: supabase/seed_fase_pruebas.sql
```

Este archivo contiene:
- 5 Regímenes fiscales configurados
- 14 Entregables/Obligaciones
- 5 Tallas con ponderaciones
- 3 Procesos operativos (NOMINA, IMSS, GENERICO)
- Matriz régimen-obligación completa
- Pesos por régimen y entregable
- Configuración SLA

---

## 7. Verificación Post-Carga

Después de ejecutar el seed, verificar:

```sql
-- Verificar sumas de pesos por régimen (debe ser 100 cada uno)
SELECT c_regimen, SUM(peso_pct) as total_peso
FROM regimen_entregable_peso
WHERE activo = true
GROUP BY c_regimen
ORDER BY c_regimen;

-- Verificar sumas de pasos por proceso (debe ser 100 cada uno)
SELECT proceso_id, SUM(peso_pct) as total_peso
FROM proceso_paso
WHERE activo = true
GROUP BY proceso_id
ORDER BY proceso_id;
```

Resultado esperado:
```
c_regimen | total_peso
----------|----------
601       | 100
612       | 100
625       | 100
626-PF    | 100
626-PM    | 100

proceso_id | total_peso
-----------|----------
GENERICO   | 100
IMSS       | 100
NOMINA     | 100
```

---

*Documento de Configuración - Fase de Pruebas*
*SGR CBC - Enero 2026*
