'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function BackgroundImage() {
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  return (
    <>
      {/* Main Background Image */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <Image
          src="/images/green-hero-background.webp"
          alt="Background"
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.85 }}
        />
      </div>

      {/* Subtle dark overlay to improve text readability */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-black/20" />
    </>
  );
}
