import { UserRole } from '@/lib/hooks/useUserRole'

export function getHomeRouteByRole(rol: UserRole | null): string {
    switch (rol) {
        case 'COLABORADOR':
            return '/dashboard/mi-dia'
        case 'LIDER':
            return '/dashboard/tmr'
        case 'AUDITOR':
            return '/dashboard/auditor'
        case 'SOCIO':
        case 'ADMIN':
        default:
            return '/dashboard/tmr'
    }
}
