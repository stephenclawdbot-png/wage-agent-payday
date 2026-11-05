import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Payday · $WAGE",
  description:
    "Live on-chain AI agent paycheck ticker. Real settlements only — $WAGE token not deployed yet.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
