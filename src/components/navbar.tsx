"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/dashboard", label: "Platform" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-4 md:mb-0"
      suppressHydrationWarning={true}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <div className="relative h-10 w-10">
            <Image
              src="/ISRO Logo.png"
              alt="ISRO Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            GeoVision Observatory
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-700 dark:text-slate-300"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader className="items-start">
                <SheetTitle className="text-left">
                  GeoVision Observatory
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
