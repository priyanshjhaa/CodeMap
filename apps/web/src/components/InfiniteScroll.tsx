"use client";

import { useEffect, useRef, useState } from "react";

export function InfiniteScroll({ children }: { children: React.ReactNode }) {
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // When scrolling near the top, jump to bottom
      if (scrollTop <= 0) {
        window.scrollTo(0, docHeight - winHeight - 1);
      }
      // When scrolling near the bottom, jump to top
      else if (scrollTop + winHeight >= docHeight - 1) {
        window.scrollTo(0, 1);
      }
    };

    // Add initial padding to prevent jump
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef}>
      {children}
      {/* Duplicate content for seamless loop */}
      <div style={{ position: "absolute", visibility: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
