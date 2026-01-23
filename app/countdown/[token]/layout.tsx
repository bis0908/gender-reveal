/**
 * 카운트다운 페이지 레이아웃
 */

import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "D-Day 카운트다운 | 젠더 리빌",
  description: "성별 공개 D-Day를 함께 기다려요! 투표하고 기대감을 나눠보세요.",
};

export default function CountdownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-160px)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
