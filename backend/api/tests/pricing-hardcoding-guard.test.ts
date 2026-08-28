import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Phase 3.23 Automated Protection — Hardcoded Pricing Value Guard", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const webSrcDir = path.join(rootDir, "apps/web/src");
  const apiSrcDir = path.join(rootDir, "backend/api/src");

  function getFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getFiles(fullPath, fileList);
      } else if (
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        !file.endsWith(".spec.ts") &&
        !file.endsWith(".d.ts")
      ) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const productionFiles = [...getFiles(webSrcDir), ...getFiles(apiSrcDir)];

  it("ensures zero hardcoded commission or profit rate multipliers (* 0.12, * 0.02, * 12 / 100, * 2 / 100) in production source", () => {
    const forbiddenPatterns = [
      {
        pattern: /\*\s*0\.12\b/,
        desc: "Hardcoded 12% commission multiplier (* 0.12)",
      },
      {
        pattern: /\*\s*0\.02\b/,
        desc: "Hardcoded 2% profit multiplier (* 0.02)",
      },
      {
        pattern: /\*\s*12\s*\/\s*100/,
        desc: "Hardcoded 12% commission percentage calculation (* 12 / 100)",
      },
      {
        pattern: /\*\s*2\s*\/\s*100/,
        desc: "Hardcoded 2% profit percentage calculation (* 2 / 100)",
      },
    ];

    const violations: string[] = [];

    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");

      for (const { pattern, desc } of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(`${relativePath}: matches ${desc}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures zero hardcoded delivery threshold evaluations (>= 59900, >= 49900) in production source", () => {
    const forbiddenPatterns = [
      {
        pattern: />=\s*59900\b/,
        desc: "Hardcoded free delivery threshold check (>= 59900)",
      },
      {
        pattern: />=\s*49900\b/,
        desc: "Hardcoded legacy delivery threshold check (>= 49900)",
      },
      {
        pattern: />=\s*599\b/,
        desc: "Hardcoded rupee delivery threshold check (>= 599)",
      },
    ];

    const violations: string[] = [];

    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");

      for (const { pattern, desc } of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(`${relativePath}: matches ${desc}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures frontend never imports or executes client-side pricing formula calculations", () => {
    const forbiddenFrontendPatterns = [
      {
        pattern: /calculateCustomerProductPricePaise/,
        desc: "Client-side customer price calculation helper",
      },
      {
        pattern: /calculateSellerNetEarningsPaise/,
        desc: "Client-side seller net earnings calculation helper",
      },
    ];

    const webFiles = getFiles(webSrcDir);
    const violations: string[] = [];

    for (const file of webFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");

      for (const { pattern, desc } of forbiddenFrontendPatterns) {
        if (pattern.test(content)) {
          violations.push(`${relativePath}: matches ${desc}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures zero hardcoded fallback financial constants (0.12 commission, 0.02 profit, 59900 threshold) in production pricing logic", () => {
    const forbiddenFallbacks = [
      { pattern: /\breturn\s+0\.12\b/, desc: "Hardcoded 0.12 return value" },
      { pattern: /\breturn\s+0\.02\b/, desc: "Hardcoded 0.02 return value" },
      { pattern: /\?\?\s*59900\b/, desc: "Hardcoded 59900 fallback operator" },
      { pattern: /\?\?\s*49900\b/, desc: "Hardcoded 49900 fallback operator" },
    ];

    const violations: string[] = [];

    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");

      for (const { pattern, desc } of forbiddenFallbacks) {
        if (pattern.test(content)) {
          violations.push(`${relativePath}: matches ${desc}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures backend services calculate pricing exclusively through PricingService", () => {
    const violations: string[] = [];

    // Scan all non-pricing service files in backend/api/src
    for (const file of getFiles(apiSrcDir)) {
      const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");
      if (relativePath.includes("src/pricing/")) continue;

      const content = fs.readFileSync(file, "utf-8");
      // Check for standalone commission formula duplicates
      if (
        /\bprice_paise\s*\*\s*\(/i.test(content) ||
        /\bbase_price_paise\s*\*\s*\(/i.test(content)
      ) {
        violations.push(
          `${relativePath}: duplicate pricing calculation logic found`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
