"use client";
import nextDynamic from 'next/dynamic';
import { ClientErrorBoundary } from '../providers/error-boundary';
const SignIn = nextDynamic(() => import('@clerk/nextjs').then(m => m.SignIn), { ssr: false });
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isValidKey = typeof publishableKey === 'string' && publishableKey.startsWith('pk_') && publishableKey.length > 10;
  if (!isValidKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Authentication is not configured.</p>
      </div>
    );
  }
  return (
    <ClientErrorBoundary fallback={<div className="flex items-center justify-center min-h-screen"><p>Authentication failed to initialize.</p></div>}>
      <div className="flex items-center justify-center min-h-screen">
        <SignIn />
      </div>
    </ClientErrorBoundary>
  );
}