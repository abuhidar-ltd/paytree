import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Admin pages are dynamic server components (unstable_noStore) that
    // intentionally read the clock during render — "last 24h" queries are
    // the whole point. react-hooks/purity is a client-render rule and
    // misfires here.
    files: ["app/admin/**/*.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
