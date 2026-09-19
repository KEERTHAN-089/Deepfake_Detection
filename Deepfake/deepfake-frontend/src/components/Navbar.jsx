import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, History, LogOut, Menu, ScanSearch, User, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui";
import { cn } from "../lib/cn";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm shadow-violet-900/60">
        <ScanSearch className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">DeepScan</span>
    </Link>
  );
}

export function Avatar({ user, className = "h-8 w-8 text-sm" }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const initial = (user.displayName || user.email || "?")[0].toUpperCase();

  if (user.photoURL && user.photoURL !== brokenSrc) {
    return (
      <img
        src={user.photoURL}
        alt=""
        onError={() => setBrokenSrc(user.photoURL)}
        className={cn(className, "shrink-0 rounded-full object-cover ring-1 ring-zinc-700")}
      />
    );
  }
  return (
    <span
      className={cn(
        className,
        "flex shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-200 ring-1 ring-violet-500/30"
      )}
    >
      {initial}
    </span>
  );
}

const navLinkClass = ({ isActive }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
  );

const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  // Menus remember the path they were opened on, so navigating closes them automatically.
  const [menuPath, setMenuPath] = useState(null);
  const [mobilePath, setMobilePath] = useState(null);
  const menuOpen = menuPath === location.pathname;
  const mobileOpen = mobilePath === location.pathname;
  const setMenuOpen = (open) => setMenuPath(open ? location.pathname : null);
  const setMobileOpen = (open) => setMobilePath(open ? location.pathname : null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuPath(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuPath(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const links = [{ to: "/", label: "Analyze", icon: ScanSearch, end: true }];
  if (currentUser) links.push({ to: "/history", label: "History", icon: History });

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/75 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main"
      >
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm text-zinc-300 transition hover:bg-zinc-800/70"
              >
                <Avatar user={currentUser} />
                <span className="max-w-[10rem] truncate">{currentUser.displayName || currentUser.email}</span>
                <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 animate-fade-in overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
                >
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="truncate text-sm font-medium text-white">
                      {currentUser.displayName || "Signed in"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{currentUser.email}</p>
                  </div>
                  <div className="p-1">
                    <Link role="menuitem" to="/profile" className={menuItemClass}>
                      <User className="h-4 w-4" aria-hidden="true" /> Profile
                    </Link>
                    <Link role="menuitem" to="/history" className={menuItemClass}>
                      <History className="h-4 w-4" aria-hidden="true" /> History
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                      className={cn(menuItemClass, "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200")}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button to="/signup" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-zinc-800/70 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </NavLink>
            ))}
            {currentUser && (
              <NavLink to="/profile" className={navLinkClass}>
                <User className="h-4 w-4" aria-hidden="true" /> Profile
              </NavLink>
            )}
          </div>
          <div className="mt-3 border-t border-zinc-800/70 pt-3">
            {currentUser ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar user={currentUser} />
                  <span className="truncate text-sm text-zinc-400">{currentUser.email}</span>
                </div>
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button to="/login" variant="secondary">
                  Sign in
                </Button>
                <Button to="/signup">Get started</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
