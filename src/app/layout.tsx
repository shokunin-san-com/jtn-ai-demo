import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "JTN AI Demo",
  description: "AIによる建設現場書類の自動生成デモ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-blue-700 hover:text-blue-800 transition-colors">
              JTN AI Demo
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/demo1" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                KYKシート
              </Link>
              <Link href="/demo2" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                施工計画書
              </Link>
              <Link href="/demo3" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                工事月報
              </Link>
              <span className="w-px h-4 bg-gray-200 mx-1" />
              <Link href="/template-check" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                テンプレート調査
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-400">
            &copy; JTN AI Demo
          </div>
        </footer>
      </body>
    </html>
  );
}
