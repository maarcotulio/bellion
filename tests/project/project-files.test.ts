import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project files", () => {
  it("keeps canonical project docs in README only", () => {
    expect(existsSync("Plan.md")).toBe(false);
    expect(existsSync("docs/ROADMAP.md")).toBe(false);
    expect(existsSync("docs/SCHEMA.md")).toBe(false);
    expect(existsSync("docs/ARCHITECTURE.md")).toBe(false);

    const readme = readFileSync("README.md", "utf8");
    const agents = readFileSync("AGENTS.md", "utf8");

    expect(readme).not.toContain("docs/ROADMAP.md");
    expect(readme).not.toContain("docs/SCHEMA.md");
    expect(readme).not.toContain("docs/ARCHITECTURE.md");
    expect(`${readme}\n${agents}`).not.toContain("Plan.md");
  });

  it("uses Royal Bellion DB names in local Mongo config", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    const envExample = readFileSync(".env.example", "utf8");
    const mongoose = readFileSync("src/lib/db/mongoose.ts", "utf8");

    expect(compose).toContain("royal-bellion-mongo");
    expect(compose).toContain("MONGO_INITDB_DATABASE: royal_bellion");
    expect(envExample).toContain("MONGODB_DB=royal_bellion");
    expect(mongoose).toContain("royal_bellion");
    expect(`${compose}\n${envExample}\n${mongoose}`).not.toContain("127.0.0.1:27017/bellion");
  });

  it("places middleware inside src so it protects the src app router", () => {
    expect(existsSync("src/middleware.ts")).toBe(true);
    expect(existsSync("middleware.ts")).toBe(false);
  });

  it("uses a blue gradient app background", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");

    expect(globals).toContain("radial-gradient(circle at 22% 12%");
    expect(globals).toContain("linear-gradient(135deg, #070c15 0%, #0a1728 52%, #050a12 100%)");
    expect(globals).not.toContain("rgba(214, 168, 79");
  });
});
