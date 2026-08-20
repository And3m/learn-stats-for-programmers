import type { ReactNode } from "react";

type CalloutVariant = "note" | "warning" | "pitfall";

export function Callout({
  title,
  variant = "note",
  children,
}: {
  title?: string;
  variant?: CalloutVariant;
  children: ReactNode;
}) {
  return (
    <aside className={`callout callout--${variant}`}>
      {title ? <p className="callout__title">{title}</p> : null}
      {children}
    </aside>
  );
}
