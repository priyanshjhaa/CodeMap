import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import { BackgroundImage } from "../components/BackgroundImage";

export const metadata: Metadata = {
  title: "CodeMap",
  description: "Chat with your codebase and accelerate onboarding."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BackgroundImage />
        {children}
      </body>
    </html>
  );
}
