import type { Metadata } from "next";
import "../globals.css";
import "../[locale]/home.css";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin — Portfolio",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
