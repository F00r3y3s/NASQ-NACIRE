import type { ButtonHTMLAttributes } from "react";

import Link from "next/link";
import type { Route } from "next";

import { cx } from "@/lib/cx";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "outline" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonLinkProps = {
  children: React.ReactNode;
  className?: string;
  href: Route;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function getButtonClassName({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cx(styles.button, styles[size], styles[variant], className);
}

export function Button({
  children,
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ className, size, variant })}
      data-size={size}
      data-variant={variant}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  href,
  size = "md",
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ className, size, variant })}
      data-size={size}
      data-variant={variant}
      href={href}
    >
      {children}
    </Link>
  );
}
