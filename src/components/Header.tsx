"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Shapes, Sun } from "lucide-react";

// The same theme key as allthingspm.app: "light", "dark", or absent for the system setting.
export function applyTheme() {
  const saved = localStorage.getItem("theme-mode");
  const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

export function Header() {
  const [dark, setDark] = useState(false);
  // Read the theme after the page loads (the server cannot know it).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDark(applyTheme()), []);
  function toggle() {
    const next = !dark;
    localStorage.setItem("theme-mode", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4 sm:gap-6 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[15px] font-medium tracking-[-0.2px]">
          <span className="flex h-[26px] w-[26px] items-center justify-center bg-primary text-on-primary">
            <Shapes size={16} strokeWidth={2} />
          </span>
          My agent
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <a href="https://www.allthingspm.app" className="hidden text-[13px] text-muted hover:text-ink sm:block">Built in the AllthingsPM course</a>
          <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
