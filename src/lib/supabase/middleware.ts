import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Refresh session if expired
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser()

        // Si hay error obteniendo el usuario, tratar como no autenticado
        if (error) {
            console.error('Error getting user in middleware:', error.message)
        }

        // Redirect to login if not authenticated and trying to access protected routes
        const isAuthPage = request.nextUrl.pathname.startsWith('/login')
        const isPublicPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth')
        const isApiRoute = request.nextUrl.pathname.startsWith('/api')

        // No proteger rutas de API (manejan su propia auth)
        if (isApiRoute) {
            return supabaseResponse
        }

        if (!user && !isAuthPage && !isPublicPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Redirect to dashboard if authenticated and on login page
        if (user && isAuthPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    } catch (e) {
        // Si hay cualquier error, redirigir a login por seguridad
        console.error('Middleware error:', e)
        const isAuthPage = request.nextUrl.pathname.startsWith('/login')
        if (!isAuthPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }
}
