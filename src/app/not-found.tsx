import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell" style={{ maxWidth: "40rem", padding: "6rem 1.5rem 8rem" }}>
      <p className="eyebrow">404</p>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "3rem",
          lineHeight: 1.05,
          fontWeight: 450,
          letterSpacing: "-0.025em",
          margin: "0.75rem 0 1rem",
        }}
      >
        That page is not here.
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
        The link may be out of date, or the lesson may have been renamed. The chapter list is the
        quickest way back, and ⌘K searches everything.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }}>
        <Link className="btn btn--primary" href="/chapters">
          Browse all chapters
        </Link>
        <Link className="btn" href="/">
          Home
        </Link>
      </div>
    </div>
  );
}
