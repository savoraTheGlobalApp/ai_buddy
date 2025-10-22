import type { Metadata } from "next";
import { ChatKitScriptLoader } from "@/components/ChatKitScriptLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentKit demo",
  description: "Demo of ChatKit with hosted workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ChatKitScriptLoader />
        {children}
      </body>
    </html>
  );
}
