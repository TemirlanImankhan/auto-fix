import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11 px-4 text-sm",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary/90",
        outline: "border border-border bg-surface text-fg hover:bg-surface-2",
        ghost: "text-muted hover:text-fg hover:bg-surface-2",
        danger: "bg-danger text-fg hover:bg-danger/90",
      },
      size: {
        md: "min-h-11 px-4",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
