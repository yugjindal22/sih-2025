import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                GeoVision
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Earth Observation Platform
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link 
              href="/dashboard" 
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Platform
            </Link>
            <Link 
              href="/settings" 
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Settings
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            © 2025 GeoVision Observatory
          </div>
        </div>
      </div>
    </footer>
  );
}
