import { Inter, Poppins } from 'next/font/google';
import "./globals.css";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import { Toaster } from "sonner";

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin']
});

export const metadata = {
  title: "Course.AI - AI Course Generator",
  description: "AI-powered course generation platform. Create, customize, and share educational courses using artificial intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <GoogleOneTap />
        <body className={poppins.className}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
          >
            Skip to main content
          </a>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
