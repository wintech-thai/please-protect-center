import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";


const prompt = localFont({
  src: [
    { path: './fonts/Prompt-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PLEASE-PROTECT CENTER",
  description: "Centralized Management System",
  icons: {
    icon: "/img/please-protect.svg",
    shortcut: "/img/please-protect.svg",
    apple: "/img/please-protect.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${prompt.className}
          ${prompt.variable}
          antialiased
          bg-[#020617]
          text-blue-100
          selection:bg-cyan-500/30
        `}
      >
        {/* <LanguageProvider> */}
          {/* <QueryProvider> */}
            {/* <NuqsAdapter> */}
              
              {children}
              
            {/* </NuqsAdapter> */}
          {/* </QueryProvider> */}

          <Toaster
            richColors
            position="top-center"
            closeButton
            theme="dark"
            className={prompt.className}
            style={{ fontFamily: 'var(--font-prompt)' }}
          />

        {/* </LanguageProvider> */}
      </body>
    </html>
  );
}