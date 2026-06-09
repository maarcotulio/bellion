import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { CreatureSchema } from "../src/lib/schemas/creature";

const fixtureDirectory = path.join(process.cwd(), "fixtures", "creatures");

function formatPath(pathSegments: PropertyKey[]) {
  if (pathSegments.length === 0) {
    return "<root>";
  }

  return pathSegments.map((segment) => String(segment)).join(".");
}

async function validateFixture(fileName: string) {
  const filePath = path.join(fixtureDirectory, fileName);
  const content = await readFile(filePath, "utf8");
  const data: unknown = JSON.parse(content);
  const result = CreatureSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `- ${formatPath(issue.path)}: ${issue.message}`)
      .join("\n");

    throw new Error(`${fileName} is invalid:\n${issues}`);
  }

  return result.data.name;
}

async function main() {
  const fileNames = (await readdir(fixtureDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  if (fileNames.length === 0) {
    throw new Error(`No creature fixtures found in ${fixtureDirectory}.`);
  }

  const creatureNames = await Promise.all(fileNames.map(validateFixture));

  console.log(`Validated ${creatureNames.length} creature fixtures: ${creatureNames.join(", ")}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
