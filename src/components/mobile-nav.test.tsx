import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileNav } from "@/components/mobile-nav";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

/**
 * Renders the drawer where it actually lives: inside the site header.
 *
 * That placement is the whole point of these tests. `.site-header` carries
 * `backdrop-filter`, which makes it a containing block for `position: fixed`
 * descendants, and `position: sticky` + `z-index`, which makes it a stacking
 * context. A drawer rendered inside it resolves against the 68px header box
 * instead of the viewport and collapses into an unusable strip — which is
 * exactly what shipped, and what no existing test could see.
 */
function renderInHeader(path = "/") {
  pathname.current = path;
  const header = document.createElement("header");
  header.className = "site-header";
  document.body.appendChild(header);
  return { header, ...render(<MobileNav />, { container: header }) };
}

async function openDrawer() {
  await userEvent.click(screen.getByRole("button", { name: /open navigation/i }));
  return screen.getByRole("dialog", { name: /navigation/i });
}

describe("MobileNav placement", () => {
  it("portals the panel to document.body, not into the header", async () => {
    const { header } = renderInHeader();
    const dialog = await openDrawer();

    expect(header.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("keeps the opener in the header, where it belongs", async () => {
    const { header } = renderInHeader();
    expect(header.contains(screen.getByRole("button", { name: /open navigation/i }))).toBe(true);
  });

  it("removes the panel from the document when closed", async () => {
    renderInHeader();
    await openDrawer();
    await userEvent.click(screen.getAllByRole("button", { name: /close navigation/i })[0]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("MobileNav contents", () => {
  it("lists every site link and chapter", async () => {
    renderInHeader();
    const dialog = await openDrawer();

    for (const label of ["All chapters", "Playground", "Glossary", "Formulas", "Further reading"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    // 14 chapters plus the five site links.
    expect(dialog.querySelectorAll(".mobile-nav__link")).toHaveLength(19);
  });

  it("expands the lessons of the chapter being read, and marks the current one", async () => {
    renderInHeader("/chapters/markov/equilibrium");
    const dialog = await openDrawer();

    const lessons = [...dialog.querySelectorAll(".mobile-nav__lesson")];
    expect(lessons).toHaveLength(4);
    expect(dialog.querySelector('.mobile-nav__lesson[aria-current="page"]')?.textContent).toContain(
      "Equilibrium",
    );
  });

  it("expands nothing on a route with no chapter", async () => {
    renderInHeader("/glossary");
    const dialog = await openDrawer();
    expect(dialog.querySelectorAll(".mobile-nav__lesson")).toHaveLength(0);
  });
});

describe("MobileNav behaviour", () => {
  it("locks body scroll while open and restores it after", async () => {
    renderInHeader();
    await openDrawer();
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(screen.getAllByRole("button", { name: /close navigation/i })[0]);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("closes on Escape", async () => {
    renderInHeader();
    await openDrawer();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks the opener expanded only while the panel is open", async () => {
    renderInHeader();
    const opener = screen.getByRole("button", { name: /open navigation/i });
    expect(opener).toHaveAttribute("aria-expanded", "false");

    await openDrawer();
    expect(opener).toHaveAttribute("aria-expanded", "true");
  });
});
