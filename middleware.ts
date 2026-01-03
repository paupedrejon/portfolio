import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // La verificación de autenticación se hace en el componente de la página
  // usando useSession. El middleware solo permite el paso.
  return NextResponse.next();
}

export const config = {
  matcher: ["/study-agents/:path*"],
};

