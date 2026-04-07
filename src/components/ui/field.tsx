import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cx } from "@/lib/cx";

import styles from "./field.module.css";

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function FieldLabel({
  children,
  className,
  ...props
}: FieldLabelProps) {
  return (
    <label className={cx(styles.label, className)} {...props}>
      {children}
    </label>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return <input className={cx(styles.control, className)} {...props} />;
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ children, className, ...props }: SelectFieldProps) {
  return (
    <select className={cx(styles.control, className)} {...props}>
      {children}
    </select>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  className,
  ...props
}: TextAreaFieldProps) {
  return <textarea className={cx(styles.control, styles.textarea, className)} {...props} />;
}

export const fieldStyles = styles;

