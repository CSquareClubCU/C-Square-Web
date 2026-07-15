"use client";

import React, { useMemo, useEffect, useState } from "react";
import { fetchTeam } from "@/lib/api";

export function TeamHeroBackground({ photos }: { photos: string[] }) {

  const imagePositions = [
    [1, 2, 4, 6, 7, 9, 10, 12, 14, 15, 17, 19, 21, 23, 24, 26, 28, 29, 31, 33, 35, 36, 38],
    [0, 3, 5, 8, 11, 13, 16, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39],
    [2, 5, 7, 10, 14, 16, 17, 23, 24, 26, 29, 31, 34, 38],
    [1, 4, 6, 9, 12, 15, 18, 21, 25, 28, 31, 33, 36, 39],
    [3, 5, 8, 11, 14, 17, 22, 26, 29, 32, 35, 37],
  ];

  // Build a map of "rowIndex-colIndex" -> photo url
  // Deterministically spread photos across hasMember positions using a fixed seed shuffle
  const photoMap = useMemo(() => {
    const allPositions: { row: number; col: number }[] = [];
    imagePositions.forEach((cols, rowIdx) => {
      cols.forEach((colIdx) => {
        allPositions.push({ row: rowIdx, col: colIdx });
      });
    });

    // Sort by distance to the flanks of the text (columns 13 and 27)
    // so the first few photos aren't hidden by the central white radial gradient
    const seeded = [...allPositions].sort((a, b) => {
      // Distance to either column 13 or 27 (the visible edges)
      const distToFlanksA = Math.min(Math.abs(a.col - 13), Math.abs(a.col - 27));
      const distToFlanksB = Math.min(Math.abs(b.col - 13), Math.abs(b.col - 27));
      
      const distA = Math.abs(a.row - 2) * 2 + distToFlanksA + ((a.row * 7 + a.col * 13) % 5);
      const distB = Math.abs(b.row - 2) * 2 + distToFlanksB + ((b.row * 7 + b.col * 13) % 5);
      return distA - distB;
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={square.photo}
                      alt="Team member"
                      className="w-full h-full object-cover"
                    />
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
