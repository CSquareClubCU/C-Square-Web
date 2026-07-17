"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden noise-overlay min-h-[calc(100vh-200px)]">
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Something went wrong
          </h1>
          <p className="text-[var(--c-secondary-text)] max-w-md mx-auto mb-10 text-base md:text-lg leading-relaxed">
            We encountered an unexpected error while trying to process your request. Please try again.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="min-w-[160px] group" onClick={() => reset()}>
              <RotateCcw className="w-4 h-4 mr-2 group-hover:-rotate-90 transition-transform duration-300" />
              Try again
            </Button>
            <Link href="/">
              <Button size="lg" variant="secondary" className="min-w-[160px] group bg-white">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
