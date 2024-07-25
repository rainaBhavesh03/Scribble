import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

//const secretKey = new TextEncoder().encode(process.env.TOKEN_SECRET!);

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
    return payload; // Return decoded payload if valid
  } catch (error) {
    console.log('JWT verification failed:', error);
    return null; // Return null if invalid or expired
  }
}

function isPublicRoute(url: string) {
  const publicRoutes = ['/login', '/signup', '/verifyemail'];
  return publicRoutes.some((route) => url.startsWith(route));
}


export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Handle public routes early for efficiency
  if (!token && isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    // Redirect to login if token is missing and not on a public route
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);

    console.log('verifyToken called');

    if (!payload) {
      throw new Error('Invalid JWT token'); // More descriptive error
    }

    // Token verified, allow access for protected routes
    if (isPublicRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/', request.url)); // Redirect to home after login/signup/verifyemail
    }

    return NextResponse.next();
  } catch (error) {
      console.error('Invalid JWT token:', error);

      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set("token", "", {
        httpOnly: true,
        expires: new Date(0), // Set the expiration to a past date
        path: '/',
        sameSite: 'strict'
      });

      return response;
  }
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/verifyemail/:path*',
    '/play',
    '/profile'
  ]
};

