"use client";

import "../../onboarding.css";
import { useEffect } from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hide both the background image and overlay on onboarding pages
    const bgContainers = document.querySelectorAll('.fixed.inset-0.-z-20, .fixed.inset-0.-z-10');
    bgContainers.forEach(bg => {
      (bg as HTMLElement).style.display = 'none';
    });

    return () => {
      // Restore when leaving onboarding
      bgContainers.forEach(bg => {
        (bg as HTMLElement).style.display = '';
      });
    };
  }, []);

  return (
    <>
      <div className="onboarding-background"></div>
      {children}
    </>
  );
}
