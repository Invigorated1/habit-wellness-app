"use client";
import dynamic from 'next/dynamic';
const SignIn = dynamic(() => import('@clerk/nextjs').then(m => m.SignIn), { ssr: false });
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Authentication is not configured.</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}