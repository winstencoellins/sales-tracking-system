"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card as ShadcnCard } from "@/components/ui/card";
import {
  Dialog as ShadcnDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field as ShadcnField,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** @deprecated Prefer `cn` from `@/lib/utils`. Kept for existing imports. */
function cx(...parts: Array<string | false | null | undefined>) {
  return cn(...parts);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "md" | "sm";
}) {
  return (
    <ShadcnButton
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

export function IconButton({
  active,
  danger,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <ShadcnButton
      variant="ghost"
      size="icon"
      className={cn(
        active && "border-sage-deep bg-sage",
        danger &&
          "border-[#f0cfc8] bg-danger-bg text-danger hover:bg-[#f3d9d3]",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

export function Card({
  tone,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "sage" | "yellow";
}) {
  return (
    <ShadcnCard
      {...props}
      className={cn(
        "mb-3 gap-0 rounded-card p-4 ring-0 [--card-spacing:0px]",
        tone === "sage"
          ? "bg-sage shadow-none"
          : tone === "yellow"
            ? "bg-yellow shadow-none"
            : "bg-card shadow-soft",
        className,
      )}
    >
      {children}
    </ShadcnCard>
  );
}

export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ShadcnField className={cn("mb-3.5 gap-2", className)}>
      {label != null ? (
        <FieldLabel
          htmlFor={htmlFor}
          className="text-[0.8rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase"
        >
          {label}
        </FieldLabel>
      ) : null}
      {children}
    </ShadcnField>
  );
}

export function FieldRow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <FieldGroup
      className={cn(
        "mb-0 grid grid-cols-2 gap-3 max-[380px]:grid-cols-1",
        className,
      )}
    >
      {children}
    </FieldGroup>
  );
}

const inputClass =
  "min-h-[52px] h-auto w-full rounded-box border-[1.5px] border-line bg-card px-4 py-3.5 text-base text-ink transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-[rgba(197,214,58,0.35)] md:text-base";

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className={cn(inputClass, className)} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClass, className)}>
      {children}
    </select>
  );
}

export function BtnRow({
  inline,
  className,
  children,
}: {
  inline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex gap-2.5 max-[380px]:flex-col",
        inline
          ? "justify-start [&_button]:w-auto [&_button]:flex-none"
          : "[&_button]:w-auto [&_button]:flex-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <Alert
      variant="destructive"
      className="mb-3.5 border-none bg-danger-bg px-3.5 py-3 text-[0.95rem] text-danger"
    >
      <AlertDescription className="text-[0.95rem] text-danger">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function FormSuccess({ children }: { children: ReactNode }) {
  return (
    <Alert className="mb-3.5 border-none bg-success-bg px-3.5 py-3 text-[0.95rem] text-ink">
      <AlertDescription className="text-[0.95rem] text-ink">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function DialogMessage({ children }: { children: ReactNode }) {
  return (
    <DialogDescription className="mb-4 text-[0.95rem] leading-[1.55] text-muted-foreground [&_strong]:font-bold [&_strong]:text-ink">
      {children}
    </DialogDescription>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="my-4 mb-2.5 text-base font-bold tracking-[-0.02em] text-ink first:mt-1">
      {children}
    </h2>
  );
}

export function Muted({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("text-muted-foreground", className)}>{children}</span>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ShadcnDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Mobile: bottom sheet with horizontal inset
          "top-auto right-auto bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-80",
          "max-h-[min(86dvh,640px)] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 translate-y-0",
          "gap-0 overflow-y-auto overscroll-contain rounded-[28px_28px_24px_24px] bg-card",
          "px-[18px] pt-[18px] pb-5 shadow-[0_20px_50px_rgba(26,26,26,0.18)] ring-0",
          "animate-dialog-rise-in",
          // Desktop/tablet: centered modal
          "min-[480px]:top-1/2 min-[480px]:bottom-auto min-[480px]:-translate-y-1/2",
          "min-[480px]:rounded-[28px]",
        )}
      >
        <DialogHeader className="mb-4 flex-row items-center justify-between gap-3 space-y-0 text-left">
          <DialogTitle className="pr-2 text-[1.2rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
            {title}
          </DialogTitle>
          <DialogClose
            render={
              <ShadcnButton
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label="Tutup"
              />
            }
          >
            <X strokeWidth={2.25} />
            <span className="sr-only">Tutup</span>
          </DialogClose>
        </DialogHeader>
        <div className="min-w-0">{children}</div>
      </DialogContent>
    </ShadcnDialog>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-8 text-center text-[0.95rem] text-muted-foreground">
      {children}
    </div>
  );
}

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="px-3 py-6 text-center text-muted-foreground" role="status">
      <Spinner className="mx-auto mb-2.5 size-[22px]" aria-hidden />
      {label}
    </div>
  );
}

const skeletonBase = "rounded-card bg-line/80";

export function SkeletonTickets({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(skeletonBase, "mb-2.5 h-[110px] rounded-card")}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 2 }: { count?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(skeletonBase, "mb-2.5 h-20 rounded-card")}
        />
      ))}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <Skeleton
      aria-hidden
      className={cn(skeletonBase, "mb-2 h-3.5 rounded-box", className)}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Skeleton
      aria-hidden
      className={cn(skeletonBase, "mb-2.5 h-20 rounded-card", className)}
    />
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-3 py-6 text-center text-danger">{message}</div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onChange(next[0]);
      }}
      spacing={0}
      className={cn(
        "inline-flex w-full gap-0.5 rounded-pill border-[1.5px] border-solid border-line bg-card p-1",
        className,
      )}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={cn(
            "min-h-11 flex-1 rounded-pill px-3.5 py-2.5 text-[0.9rem] font-bold",
            "data-[pressed]:bg-ink data-[pressed]:text-white",
            "aria-pressed:bg-ink aria-pressed:text-white",
          )}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function Chip({
  active,
  children,
  onClick,
  type = "button",
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <Toggle
      type={type}
      pressed={active}
      onClick={onClick}
      variant="outline"
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border-[1.5px] px-4 py-2.5 text-[0.9rem] font-semibold [&_svg]:size-4",
        active
          ? "border-ink bg-ink text-white hover:bg-ink hover:text-white"
          : "border-line bg-card text-ink",
      )}
    >
      {children}
    </Toggle>
  );
}

export function ChipScroll({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "chip-scroll -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 pb-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-box bg-sage px-2.5 py-3.5 text-center">
      <span className="[&_svg]:size-5 [&_svg]:text-ink">{icon}</span>
      <span className="text-[0.75rem] leading-tight font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[0.8rem] leading-[1.25] font-bold break-words text-ink tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function ToggleLink({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ShadcnButton
      type="button"
      variant="link"
      {...props}
      className={cn(
        "h-auto w-full rounded-none p-2.5 text-center text-[0.95rem] font-bold active:scale-100",
        className,
      )}
    >
      {children}
    </ShadcnButton>
  );
}

export { cx, inputClass, skeletonBase };
