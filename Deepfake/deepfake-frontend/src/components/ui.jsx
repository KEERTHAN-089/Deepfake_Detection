import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";
import { AlertCircle, AlertTriangle, CheckCircle2, Eye, EyeOff, Info, Loader2 } from "lucide-react";


const BUTTON_VARIANTS = {
  primary: "bg-violet-600 text-white shadow-sm shadow-violet-950/50 hover:bg-violet-500",
  secondary: "bg-zinc-800/80 text-zinc-100 ring-1 ring-inset ring-zinc-700 hover:bg-zinc-700/80",
  ghost: "text-zinc-300 hover:bg-zinc-800/70 hover:text-white",
  danger: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20",
  white: "bg-white text-zinc-900 hover:bg-zinc-200",
};

const BUTTON_SIZES = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
  icon: "h-9 w-9",
};

export function Button({
  to,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ id, label, hint, error, icon: Icon, trailing, className, ...props }) {
  const describedBy = error || hint ? `${id}-help` : undefined;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "block h-11 w-full rounded-lg border bg-zinc-950/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500",
            "transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/25"
              : "border-zinc-800 focus:border-violet-500 focus:ring-violet-500/25",
            Icon && "pl-10",
            trailing && "pr-11",
            className
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={describedBy} className={cn("text-xs", error ? "text-rose-400" : "text-zinc-500")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md p-2 text-zinc-500 transition hover:text-zinc-200"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      }
    />
  );
}

const ALERT_STYLES = {
  error: [AlertCircle, "border-rose-500/30 bg-rose-500/10 text-rose-200"],
  success: [CheckCircle2, "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"],
  info: [Info, "border-sky-500/25 bg-sky-500/10 text-sky-200"],
  warning: [AlertTriangle, "border-amber-500/30 bg-amber-500/10 text-amber-200"],
};

export function Alert({ variant = "error", title, children, action, className }) {
  const [Icon, styles] = ALERT_STYLES[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", styles, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-violet-400", className)} aria-hidden="true" />;
}

export function VerdictBadge({ prediction, className }) {
  const fake = prediction === "FAKE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        fake
          ? "bg-rose-500/10 text-rose-300 ring-rose-500/30"
          : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", fake ? "bg-rose-400" : "bg-emerald-400")} />
      {fake ? "Likely deepfake" : "Likely authentic"}
    </span>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
      <div className="h-px flex-1 bg-zinc-800" />
      {label && <span>{label}</span>}
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-zinc-700">
          <Icon className="h-5 w-5 text-zinc-300" aria-hidden="true" />
        </div>
      )}
      <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </Card>
  );
}

const STAT_TONES = {
  default: "text-zinc-300 bg-zinc-800/80",
  fake: "text-rose-300 bg-rose-500/10",
  real: "text-emerald-300 bg-emerald-500/10",
  accent: "text-violet-300 bg-violet-500/10",
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "default" }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", STAT_TONES[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>}
    </Card>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-800/70", className)} />;
}

export function FullScreenLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}
