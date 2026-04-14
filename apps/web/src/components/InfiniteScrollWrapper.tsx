"use client";

import { useEffect, useRef } from "react";

export function InfiniteScrollWrapper() {
  const lastScrollY = useRef(0);
  const isResetting = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isResetting.current) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollDirection = scrollTop > lastScrollY.current ? "down" : "up";

      // When scrolling up and at the top
      if (scrollDirection === "up" && scrollTop <= 0) {
        isResetting.current = true;
        window.scrollTo(0, docHeight - winHeight);
        lastScrollY.current = docHeight - winHeight;
        setTimeout(() => {
          isResetting.current = false;
        }, 50);
      }
      // When scrolling down and at the bottom
      else if (scrollDirection === "down" && scrollTop + winHeight >= docHeight - 1) {
        isResetting.current = true;
        window.scrollTo(0, 1);
        lastScrollY.current = 1;
        setTimeout(() => {
          isResetting.current = false;
        }, 50);
      } else {
        lastScrollY.current = scrollTop;
      }
    };

    // Use a small delay for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, []);

  return null;
}
