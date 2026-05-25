// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers de seguridad para endpoints de autenticación y contraseñas
  if (request.nextUrl.pathname.startsWith("/api/auth") || 
      request.nextUrl.pathname.startsWith("/api/change-password")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    
    // Rate limiting más estricto para cambios de contraseña
    const isPasswordChange = request.nextUrl.pathname.startsWith("/api/change-password");
    const maxAttempts = isPasswordChange ? 3 : 5;
    const attempts = request.cookies.get("pwd_attempts")?.value;
    
    if (attempts && parseInt(attempts) > maxAttempts) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente más tarde." },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/change-password/:path*"],
};