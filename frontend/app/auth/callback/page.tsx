'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyMagicLink } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No authentication token provided.');
      return;
    }

    const authenticate = async () => {
      try {
        await verifyMagicLink(token);
        // Successfully verified and token saved to localStorage
        router.push('/dashboard');
      } catch (err: any) {
        console.error('Magic link verification failed:', err);
        setError(err.data?.error?.message || 'Failed to authenticate. The link may have expired.');
      }
    };

    authenticate();
  }, [token, router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <h2 className="mb-2 text-lg font-semibold">Authentication Failed</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-muted-foreground">Authenticating securely...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
