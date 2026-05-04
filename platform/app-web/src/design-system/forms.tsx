import type { InputHTMLAttributes, ReactNode } from "react";

export function DsFormField({
  label,
  htmlFor,
  message,
  messageTone = "info",
  children,
}: {
  label: string;
  htmlFor?: string;
  message?: string;
  messageTone?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <div className="ds-form-field">
      <label className="ds-form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {message ? (
        <p
          className={
            messageTone === "error"
              ? "ds-form-field__message ds-form-field__message--error"
              : "ds-form-field__message"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function DsTextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={["ds-form-field__input", props.className ?? ""].join(" ").trim()} />;
}

export function DsDisabledActionArea({ children }: { children: ReactNode }) {
  return <section className="ds-disabled-action-area">{children}</section>;
}
