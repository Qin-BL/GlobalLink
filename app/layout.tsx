import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b bg-white">
          <div className="container py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">Next English App</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/play/word-blitz" className="hover:underline">百词斩</Link>
              <Link href="/learn/sentence-builder" className="hover:underline">连词造句</Link>
              <Link href="/leaderboard" className="hover:underline">排行榜</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Next English App (Open Source)
        </footer>
      </body>
    </html>
  );
}
