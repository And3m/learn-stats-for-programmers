import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * Replace MDX lessons with an inert component.
 *
 * `content.test.ts` imports the generated lesson map to check that every
 * declared lesson resolves to a file. It cares about the keys, not the prose —
 * and the prose is already exercised by `scripts/verify-python.mjs`, which runs
 * every code cell for real. Stubbing avoids pulling an MDX toolchain into the
 * unit-test run.
 */
function mdxStub(): Plugin {
  return {
    name: "mdx-stub",
    enforce: "pre",
    transform(_code, id) {
      if (!id.endsWith(".mdx")) return null;
      return { code: "export default function MdxStub() { return null; }", map: null };
    },
  };
}

export default defineConfig({
  plugins: [mdxStub(), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // The default forks pool fails to spawn workers on Windows here.
    pool: "threads",
  },
});
