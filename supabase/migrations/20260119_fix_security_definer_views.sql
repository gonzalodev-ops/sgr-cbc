-- ============================================
-- Migration: Fix SECURITY DEFINER Views
-- Date: 2026-01-19
-- Description: Sets security_invoker = true on views that were
--              created with SECURITY DEFINER property to ensure
--              they respect the querying user's RLS policies
-- ============================================

-- vw_ranking_calidad
ALTER VIEW IF EXISTS public.vw_ranking_calidad SET (security_invoker = true);

-- vw_tendencia_calidad
ALTER VIEW IF EXISTS public.vw_tendencia_calidad SET (security_invoker = true);

-- vw_dashboard_riesgo
ALTER VIEW IF EXISTS public.vw_dashboard_riesgo SET (security_invoker = true);

-- vw_hallazgos_por_tipo
ALTER VIEW IF EXISTS public.vw_hallazgos_por_tipo SET (security_invoker = true);

-- vw_auditoria_resumen
ALTER VIEW IF EXISTS public.vw_auditoria_resumen SET (security_invoker = true);

-- vw_auditoria_pendientes
ALTER VIEW IF EXISTS public.vw_auditoria_pendientes SET (security_invoker = true);

-- vw_hallazgos_pendientes
ALTER VIEW IF EXISTS public.vw_hallazgos_pendientes SET (security_invoker = true);
