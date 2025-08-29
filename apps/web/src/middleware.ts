import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from './middleware/security';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // For Clerk webhooks
  '/api/health', // Health check endpoint
  '/api-docs', // API documentation
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Create response
  let response = NextResponse.next();
  
  // Apply security headers to all responses
  response = applySecurityHeaders(response);
  
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};