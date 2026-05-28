"use client";

import { useEffect } from "react";

export function OnboardingChrome({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const bgContainers = document.querySelectorAll(".fixed.inset-0.-z-20, .fixed.inset-0.-z-10");
    bgContainers.forEach((bg) => {
      (bg as HTMLElement).style.display = "none";
    });

    return () => {
      bgContainers.forEach((bg) => {
        (bg as HTMLElement).style.display = "";
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
