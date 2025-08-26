"use client";
import dynamic from 'next/dynamic';
const SignUp = dynamic(() => import('@clerk/nextjs').then(m => m.SignUp), { ssr: false });
export const dynamic = "force-dynamic";

export default function SignUpPage() {
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
      <SignUp />
    </div>
  );
}