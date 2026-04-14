import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function generateBackground(width: number, height: number, outputPath: string) {
  // Create a vibrant gradient mesh using SVG
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <!-- Main gradient 1 - Top left warm glow -->
        <radialGradient id="grad1" cx="20%" cy="20%" r="60%">
          <stop offset="0%" stop-color="rgba(212, 165, 116, 0.8)" />
          <stop offset="40%" stop-color="rgba(196, 154, 100, 0.5)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <!-- Main gradient 2 - Bottom right glow -->
        <radialGradient id="grad2" cx="80%" cy="80%" r="70%">
          <stop offset="0%" stop-color="rgba(212, 165, 116, 0.6)" />
          <stop offset="50%" stop-color="rgba(196, 154, 100, 0.4)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <!-- Accent gradient 3 - Center -->
        <radialGradient id="grad3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(212, 165, 116, 0.5)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <!-- Accent gradient 4 - Top right -->
        <radialGradient id="grad4" cx="80%" cy="20%" r="40%">
          <stop offset="0%" stop-color="rgba(196, 154, 100, 0.4)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <!-- Accent gradient 5 - Bottom left -->
        <radialGradient id="grad5" cx="20%" cy="80%" r="45%">
          <stop offset="0%" stop-color="rgba(212, 165, 116, 0.3)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <!-- Filter for blur effect -->
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
        </filter>
      </defs>

      <!-- Black background -->
      <rect width="100%" height="100%" fill="#0a0a0a"/>

      <!-- Large gradient circles with blur -->
      <circle cx="${width * 0.2}" cy="${height * 0.2}" r="${width * 0.6}" fill="url(#grad1)" filter="url(#blur)"/>
      <circle cx="${width * 0.8}" cy="${height * 0.8}" r="${width * 0.55}" fill="url(#grad2)" filter="url(#blur)"/>
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${width * 0.45}" fill="url(#grad3)" filter="url(#blur)"/>
      <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${width * 0.35}" fill="url(#grad4)" filter="url(#blur)"/>
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.38}" fill="url(#grad5)" filter="url(#blur)"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .webp({ quality: 90, effort: 6 })
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function main() {
  const publicDir = join(process.cwd(), 'public', 'images');
  await mkdir(publicDir, { recursive: true });

  await generateBackground(1920, 1080, join(publicDir, 'hero-bg.webp'));
  await generateBackground(800, 600, join(publicDir, 'hero-bg-mobile.webp'));

  console.log('✅ Background images generated successfully!');
}

main().catch(console.error);
