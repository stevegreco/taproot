import { useState } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "min-h-8 px-3 text-sm",
  medium: "min-h-10 px-4 text-sm",
  large: "min-h-12 px-5 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function ButtonExample() {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="flex flex-col gap-6 p-6 text-slate-900 dark:text-white">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setClicks((count) => count + 1)}>
          Primary
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Delete</Button>
        <Button disabled>Disabled</Button>
      </div>
      <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
        Primary button clicked {clicks} {clicks === 1 ? "time" : "times"}.
      </p>
    </div>
  );
}
