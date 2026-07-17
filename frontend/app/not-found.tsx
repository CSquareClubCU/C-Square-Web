"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden noise-overlay min-h-[calc(100vh-200px)]">
      {/* Massive subtle background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <span className="text-[35vw] font-bold tracking-tighter leading-none select-none">404</span>
      </div>
      
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Page not found
          </h2>
          <p className="text-[var(--c-secondary-text)] max-w-md mx-auto mb-10 text-lg leading-relaxed">
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="min-w-[180px] group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="secondary" className="min-w-[180px] group bg-white">
                <Compass className="w-4 h-4 mr-2 text-[var(--c-muted-text)] group-hover:text-[var(--c-accent)] transition-colors" />
                Browse Events
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
