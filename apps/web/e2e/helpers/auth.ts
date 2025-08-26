import { BrowserContext } from '@playwright/test';

export async function mockAuthenticatedUser(context: BrowserContext) {
  // Set auth cookies - this is a simplified version
  // In real tests, you'd either:
  // 1. Use Clerk's test tokens
  // 2. Set up test users and perform actual login
  // 3. Mock the auth state at the API level
  
  await context.addCookies([
    {
      name: '__clerk_db_jwt',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '__session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Add authorization header for API requests
  await context.setExtraHTTPHeaders({
    'Authorization': 'Bearer mock-jwt-token',
  });
}

export async function clearAuth(context: BrowserContext) {
  await context.clearCookies();
}