"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function Typewriter({ texts, speed = 100, pause = 2000 }: { texts: string[], speed?: number, pause?: number }) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isPaused) {
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pause);
      return () => clearTimeout(timeout);
    }

    const currentText = texts[textIndex];

    timeout = setTimeout(() => {
      if (isDeleting) {
        setCharIndex((prev) => prev - 1);
        if (charIndex <= 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      } else {
        setCharIndex((prev) => prev + 1);
        if (charIndex >= currentText.length) {
          setIsPaused(true);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, isPaused, texts, textIndex, speed, pause]);

  const currentText = texts[textIndex].substring(0, charIndex);

  return (
    <span className="inline-flex items-center">
      <span className="invisible w-0 select-none">&#8203;</span>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[3px] h-[1em] bg-current ml-1"
      />
    </span>
  );
}
