import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "navigation"
  | "secondary"
  | "download"
  | "state-changing"
  | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function DsButton({
  variant = "secondary",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "ds-button",
    `ds-button--${variant}`,
    className ?? "",
  ]
    .join(" ")
    .trim();
  return <button type={type} className={classes} {...rest} />;
}
