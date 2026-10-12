"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "homework_theme";
const THEME_CHANGE_EVENT = "homework-theme-change";

const getThemeSnapshot = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const subscribeToTheme = (callback: () => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
};

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const shouldUseDarkTheme =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", shouldUseDarkTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;

    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextIsDark ? "dark" : "light",
    );
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "تشغيل الوضع الفاتح" : "تشغيل الوضع الداكن"}
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
      className="fixed left-5 top-20 z-[100] grid size-11 place-items-center rounded-full border-2 border-[#173F5F] bg-[#F6C445] text-[#173F5F] shadow-[3px_3px_0_#173F5F] transition duration-200 hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none max-sm:left-4"
    >
      {!isDark ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
