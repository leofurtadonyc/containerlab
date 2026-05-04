import type { ReactNode } from "react";

type CopyVariant = "non-claim" | "caveat" | "backend-echo";

interface CopyBannerProps {
  title: string;
  children: ReactNode;
  variant: CopyVariant;
}

function variantClass(variant: CopyVariant): string {
  switch (variant) {
    case "non-claim":
      return "ds-copy-banner--non-claim";
    case "backend-echo":
      return "ds-copy-banner--backend-echo";
    default:
      return "ds-copy-banner--caveat";
  }
}

export function DsCopyBanner({ title, children, variant }: CopyBannerProps) {
  return (
    <aside className={["ds-copy-banner", variantClass(variant)].join(" ").trim()}>
      <h4 className="ds-copy-banner__title">{title}</h4>
      <p className="ds-copy-banner__text">{children}</p>
    </aside>
  );
}

export function DsNonClaimBanner(props: Omit<CopyBannerProps, "variant">) {
  return <DsCopyBanner {...props} variant="non-claim" />;
}

export function DsEvidenceCaveat(props: Omit<CopyBannerProps, "variant">) {
  return <DsCopyBanner {...props} variant="caveat" />;
}

export function DsBackendEcho(props: Omit<CopyBannerProps, "variant">) {
  return <DsCopyBanner {...props} variant="backend-echo" />;
}
