"use client";

import React, { useMemo } from "react";

export function TeamHeroBackground() {
  // Extremely dense population, filling the top and bringing images very close to the center text
  const imagePositions = [
    [1, 2, 4, 6, 7, 9, 10, 12, 14, 15, 17, 19, 21, 23, 24, 26, 28, 29, 31, 33, 35, 36, 38], // Very dense top row
    [0, 3, 5, 8, 11, 13, 16, 18, 20, 22, 25, 27, 30, 32, 34, 37, 39], // Dense second row, near center
    [2, 5, 7, 10, 14, 16, 17, 23, 24, 26, 29, 31, 34, 38], // Images right up against the text and faded behind it
    [1, 4, 6, 9, 12, 15, 18, 21, 25, 28, 31, 33, 36, 39], // Fourth row
    [3, 5, 8, 11, 14, 17, 22, 26, 29, 32, 35, 37],
  ];

  const rows = useMemo(() => {
    const rowCount = 5;
    const squaresPerRow = 40; 
    
    return Array.from({ length: rowCount }).map((_, rowIndex) => {
      const squares = Array.from({ length: squaresPerRow }).map((_, colIndex) => {
        const hasMember = imagePositions[rowIndex]?.includes(colIndex);
        // Use stock images sequentially for a clean look
        const photoUrl = hasMember ? `https://i.pravatar.cc/150?img=${rowIndex * 10 + (colIndex % 10)}` : null;
          
        return {
          id: `sq-${rowIndex}-${colIndex}`,
          photoUrl
        };
      });
      return squares;
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-white pointer-events-none flex flex-col justify-center items-center py-8">
      
      {/* Central radial glow to wash out tiles exactly behind the text */}
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
              // Offset alternating rows by exactly half a square (36px) + half a gap (8px) = 44px
              marginLeft: i % 2 === 0 ? "0px" : "-44px",
            }}
          >
            {/* Static row of squares */}
            <div className="flex" style={{ gap: "16px" }}>
              {row.map((square, j) => (
                <div 
                  key={`${square.id}-${j}`}
                  // Empty squares have a slightly greyish bg to stand out against pure white, images use pure white bg
                  className={`w-[72px] h-[72px] rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03] flex items-center justify-center overflow-hidden shrink-0 ${square.photoUrl ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                >
                  {square.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={square.photoUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
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
