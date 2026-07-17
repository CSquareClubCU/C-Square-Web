"use client";

import React, { useMemo, useEffect, useState } from "react";
import { fetchTeam } from "@/lib/api";
const imagePositions = [
  [1, 2, 4, 6, 7, 9, 10, 12, 14, 15, 17, 19, 21, 23, 24, 26, 28, 29, 31, 33, 35, 36, 38],
  [0, 3, 5, 8, 11, 13, 16, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39],
  [2, 5, 7, 10, 14, 16, 17, 23, 24, 26, 29, 31, 34, 38],
  [1, 4, 6, 9, 12, 15, 18, 21, 25, 28, 31, 33, 36, 39],
  [3, 5, 8, 11, 14, 17, 22, 26, 29, 32, 35, 37],
];

function FadeInImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt="Team member"
      onLoad={() => setLoaded(true)}
      className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function TeamHeroBackground({ photos }: { photos: string[] }) {

  // Build a map of "rowIndex-colIndex" -> photo url
  // Deterministically spread photos across hasMember positions using a fixed seed shuffle
  const photoMap = useMemo(() => {
    const allPositions: { row: number; col: number }[] = [];
    imagePositions.forEach((cols, rowIdx) => {
      cols.forEach((colIdx) => {
        allPositions.push({ row: rowIdx, col: colIdx });
      });
    });

    // Sort by distance from the center, but penalize the central text area
    // so images fill the visible screen around the text first.
    const seeded = [...allPositions].sort((a, b) => {
      const distFromCenterA = Math.sqrt(Math.pow(a.col - 19.5, 2) + Math.pow((a.row - 2) * 2.5, 2));
      const distFromCenterB = Math.sqrt(Math.pow(b.col - 19.5, 2) + Math.pow((b.row - 2) * 2.5, 2));
      
      const penaltyA = (a.col >= 14 && a.col <= 25 && a.row >= 1 && a.row <= 3) ? 15 : 0;
      const penaltyB = (b.col >= 14 && b.col <= 25 && b.row >= 1 && b.row <= 3) ? 15 : 0;
      
      const noiseA = ((a.row * 7 + a.col * 13) % 5) * 0.5;
      const noiseB = ((b.row * 7 + b.col * 13) % 5) * 0.5;
      
      const scoreA = distFromCenterA + penaltyA + noiseA;
      const scoreB = distFromCenterB + penaltyB + noiseB;
      
      return scoreA - scoreB;
    });

    const map = new Map<string, string>();
    photos.forEach((url, i) => {
      if (i < seeded.length) {
        const pos = seeded[i];
        map.set(`${pos.row}-${pos.col}`, url);
      }
    });
    return map;
  }, [photos]);

  const rows = useMemo(() => {
    return Array.from({ length: 5 }).map((_, rowIndex) => {
      const squares = Array.from({ length: 40 }).map((_, colIndex) => {
        const hasMember = imagePositions[rowIndex]?.includes(colIndex);
        const photo = photoMap.get(`${rowIndex}-${colIndex}`) ?? null;
        return {
          id: `sq-${rowIndex}-${colIndex}`,
          hasMember,
          photo,
        };
      });
      return squares;
    });
  }, [photoMap]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-white pointer-events-none flex flex-col justify-center items-center py-8">

      {/* Central radial glow */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at center, white 0%, rgba(255,255,255,0.7) 40%, transparent 80%)"
        }}
      />

      {/* Top and Bottom Fade Masks */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, white 0%, transparent 30%, transparent 70%, white 100%)"
        }}
      />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, white 0%, transparent 10%, transparent 90%, white 100%)"
        }}
      />

      {/* Grid Container */}
      <div className="flex flex-col min-w-max" style={{ gap: "16px" }}>
        {rows.map((row, i) => (
          <div
            key={`row-${i}`}
            className="flex"
            style={{
              gap: "16px",
              marginLeft: i % 2 === 0 ? "0px" : "-44px",
            }}
          >
            <div className="flex" style={{ gap: "16px" }}>
              {row.map((square, j) => (
                <div
                  key={`${square.id}-${j}`}
                  className={`w-[72px] h-[72px] rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03] flex items-center justify-center overflow-hidden shrink-0 ${
                    square.hasMember ? "bg-[#EFEFEF]" : "bg-[#FAFAFA]"
                  }`}
                >
                  {square.photo ? (
                    <FadeInImage src={square.photo} />
                  ) : square.hasMember ? (
                    <svg className="w-8 h-8 text-black/10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
