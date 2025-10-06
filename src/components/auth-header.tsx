import Link from "next/link";
import { MapPin } from "lucide-react";

export function AuthHeader() {
  return (
    <header className="w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span className="font-semibold">Rivers State Cadastral Survey</span>
        </Link>
        <nav className="text-sm text-gray-600">
          <Link href="/login" className="hover:underline mr-4">
            Login
          </Link>
          <Link href="/register" className="hover:underline">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
