import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "devshowcase",
    template: "%s | devshowcase",
  },
  description:
    "スキルと経歴を登録して、ポートフォリオとして公開できるサービス。文章の整形と技術ロゴ付きの表示つき。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="font-semibold tracking-tight">
              devshowcase
            </Link>
            <Link
              href="/edit"
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent"
            >
              自分のページを作る
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-muted sm:px-6">
            devshowcase
          </div>
        </footer>
      </body>
    </html>
  );
}
