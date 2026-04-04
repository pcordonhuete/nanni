import Link from "next/link";
import { Moon } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nanni-50 via-white to-nanni-50 flex flex-col">
      <header className="p-4 sm:p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Moon className="w-6 h-6 text-nanni-600" />
          <span className="text-xl font-bold text-gray-900">Nanni</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
