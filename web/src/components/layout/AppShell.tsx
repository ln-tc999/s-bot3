"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => (
  /**
   * The reduced-motion rule in globals.css only reaches CSS. Motion animates in
   * JS, so it has to be told separately or the preference is silently ignored.
   */
  <MotionConfig reducedMotion="user">
    {/*
     * A flex column at full viewport height with `main` taking the slack, so
     * the footer lands on the bottom edge on a short page and below the
     * content on a long one. Without this it simply trails whatever content
     * happens to be there, and sits at a different height on every page.
     *
     * The bottom padding is on the wrapper rather than on `main`, so the
     * footer clears the mobile tab bar too instead of hiding behind it.
     */}
    <div className="flex min-h-dvh flex-col pb-28 lg:pb-0 lg:pl-[17rem]">
      <Sidebar />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-8 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  </MotionConfig>
);
