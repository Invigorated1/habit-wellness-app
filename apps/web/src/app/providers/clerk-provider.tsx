'use client';
import nextDynamic from 'next/dynamic';
import { ClientErrorBoundary } from './error-boundary';
const ClientClerkProvider = nextDynamic(
  () => import('@clerk/nextjs').then(m => m.ClerkProvider),
  { ssr: false }
);

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isValidKey = typeof publishableKey === 'string' && publishableKey.startsWith('pk_') && publishableKey.length > 10;
  if (!isValidKey) {
    return <>{children}</>;
  }
  return (
    <ClientErrorBoundary fallback={<>{children}</>}>
      <ClientClerkProvider
        publishableKey={publishableKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      >
        {children}
      </ClientClerkProvider>
    </ClientErrorBoundary>
  );
}