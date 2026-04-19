import { BotIdClient } from "botid/client";
import { Metadata } from "next";
import { Toaster } from "sonner";

import { Navbar } from "@/components/custom/navbar";
import { ThemeProvider } from "@/components/custom/theme-provider";

import "./globals.css";

const protectedRoutes = [
  {
    path: "/api/chat",
    method: "POST",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL("https://gemini.vercel.ai"),
  title: "Next.js Gemini Chatbot",
  description: "Next.js chatbot template using the AI SDK and Gemini.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
