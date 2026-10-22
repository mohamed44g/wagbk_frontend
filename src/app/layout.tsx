import type { Metadata } from "next";
import "./globals.css";
import "aos/dist/aos.css";
import AosProvider from "./components/AosProvider";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./components/ToastProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wagbk.com"),
  title: "واجبك | منصة تعليمية لإدارة الواجبات",
  description:
    "منصة تعليمية لإدارة الواجبات وتصحيحها ورصد الدرجات ومتابعة أداء الطلاب بسهولة، مع تنظيم الواجبات وإتاحة مراجعة الأخطاء ومراقبة المستوى في مكان واحد.",
  keywords: ["واجبك", "إدارة الواجبات", "تصحيح الواجبات", "متابعة الطلاب", "منصة تعليمية"],
  icons: {
    icon: [{ url: "/images/wagbk-favicon.png", type: "image/png" }],
    shortcut: "/images/wagbk-favicon.png",
    apple: "/images/wagbk-favicon.png",
  },
  openGraph: {
    title: "واجبك | منصة تعليمية لإدارة الواجبات",
    description:
      "منصة تعليمية لإدارة الواجبات وتصحيحها ورصد الدرجات ومتابعة أداء الطلاب بسهولة، مع تنظيم الواجبات وإتاحة مراجعة الأخطاء ومراقبة المستوى في مكان واحد.",
    url: "https://www.wagbk.com",
    siteName: "واجبك",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/images/wagbk-logo.png", width: 1070, height: 770, alt: "شعار واجبك" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "واجبك | منصة تعليمية لإدارة الواجبات",
    description:
      "منصة تعليمية لإدارة الواجبات وتصحيحها ورصد الدرجات ومتابعة أداء الطلاب بسهولة، مع تنظيم الواجبات وإتاحة مراجعة الأخطاء ومراقبة المستوى في مكان واحد.",
    images: ["/images/wagbk-logo.png"],
  },
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
