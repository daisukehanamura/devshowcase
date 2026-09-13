"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

/**
 * 画面全体で使い回す最小の見た目。
 * 増やしすぎるとコンポーネント探しが始まるので、3回以上書いたものだけここに上げる。
 */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-strong",
  ghost: "text-muted hover:bg-surface-strong hover:text-foreground",
  danger: "text-danger hover:bg-danger-soft",
} as const;

const BUTTON_SIZES = {
  sm: "h-8 px-2.5",
  md: "h-10 px-4",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
};

export const Button = ({
  variant = "outline",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    {...rest}
  />
);

const CONTROL =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus-visible:border-accent";

export const TextInput = ({
  invalid = false,
  className = "",
  ...rest
}: ComponentProps<"input"> & { invalid?: boolean }) => (
  <input
    aria-invalid={invalid || undefined}
    className={`${CONTROL} ${invalid ? "border-danger" : "border-border"} ${className}`}
    {...rest}
  />
);

export const TextArea = ({
  invalid = false,
  className = "",
  ...rest
}: ComponentProps<"textarea"> & { invalid?: boolean }) => (
  <textarea
    aria-invalid={invalid || undefined}
    className={`${CONTROL} resize-y leading-relaxed ${invalid ? "border-danger" : "border-border"} ${className}`}
    {...rest}
  />
);

export const Select = ({ className = "", ...rest }: ComponentProps<"select">) => (
  <select className={`${CONTROL} border-border pr-8 ${className}`} {...rest} />
);

type FieldProps = {
  label: string;
  /** 入力欄の下に出す説明。何を書けばいいか迷わせないために使う。 */
  hint?: string;
  error?: string;
  required?: boolean;
  /**
   * ラベルと結びつける id を受け取って入力欄を描く。
   * 呼び出し側に id を作らせると付け忘れるので、こちらから配る。
   */
  children: (id: string) => ReactNode;
  className?: string;
};

export const Field = ({ label, hint, error, required, children, className = "" }: FieldProps) => {
  const id = useId();

  return (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-sm font-medium">
      {label}
      {required && (
        <span className="ml-1 text-danger" aria-label="必須">
          *
        </span>
      )}
    </label>
    {children(id)}
    {/* エラーが出たらヒントは引っ込める。同じ場所に2行出すと読み飛ばされる。 */}
    {error ? (
      <p className="text-xs text-danger" role="alert">
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-muted">{hint}</p>
    )}
  </div>
  );
};

export const Card = ({ className = "", ...rest }: ComponentProps<"div">) => (
  <div
    className={`rounded-xl border border-border bg-surface p-5 sm:p-6 ${className}`}
    {...rest}
  />
);

export const SectionHeading = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-sm leading-snug text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
    {children}
  </p>
);
