import type { Metadata } from "next";
import "./globals.css";
import "aos/dist/aos.css";
import AosProvider from "./components/AosProvider";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./components/ToastProvider";

export const metadata: Metadata = {
  title: "واجبك | منصة إدارة واجبات السناتر",
  description: "تابع واجباتك ودرجاتك وتقدّمك من مكان واحد.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full [font-family:'Tajawal',sans-serif]">
        <AosProvider />
        <ThemeToggle />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
