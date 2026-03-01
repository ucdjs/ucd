import { glob, readFile, writeFile } from "node:fs/promises";
import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

const allGrammarFiles: string[] = [];
for await (const file of glob("grammars/**/*.json", {
  cwd: "./node_modules/@ucdjs/textmate-grammars",
})) {
  allGrammarFiles.push(file);
}

console.log("All grammar files:", allGrammarFiles);

interface PackageJson {
  contributes?: {
    grammars?: Array<{
      language?: string;
      scopeName: string;
      path: string;
      injectTo?: string[];
      embeddedLanguages?: Record<string, string>;
      tokenTypes?: Record<string, string>;
    }>;
  };
}

interface GrammarFile {
  scopeName?: string;
}

async function loadGrammarFile(file: string): Promise<GrammarFile> {
  return import(`@ucdjs/textmate-grammars/${file}`, {
    with: {
      type: "json",
    },
  }).then((mod) => mod.default as GrammarFile);
}

async function syncContributedGrammars() {
  const packageJsonPath = new URL("./package.json", import.meta.url);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;

  const existingGrammars = packageJson.contributes?.grammars ?? [];
  const generatedGrammars: Array<{ scopeName: string; path: string }> = [];
  for (const file of allGrammarFiles) {
    const grammar = await loadGrammarFile(file);
    if (!grammar.scopeName) {
      continue;
    }

    const fileName = file.split("/").pop()!;
    generatedGrammars.push({
      scopeName: grammar.scopeName,
      path: `./syntaxes/${fileName}`,
    });
  }

  const mergedGrammars = [...existingGrammars];
  for (const generatedGrammar of generatedGrammars) {
    const existingIndex = mergedGrammars.findIndex(
      (grammar) => grammar.scopeName === generatedGrammar.scopeName,
    );

    if (existingIndex >= 0) {
      const existingGrammar = mergedGrammars[existingIndex];
      if (!existingGrammar) {
        continue;
      }

      mergedGrammars[existingIndex] = {
        ...existingGrammar,
        path: generatedGrammar.path,
      };
      continue;
    }

    mergedGrammars.push(generatedGrammar);
  }

  packageJson.contributes = {
    ...packageJson.contributes,
    grammars: mergedGrammars,
  };

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

export default createTsdownConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  dts: false,
  exports: false,
  publint: false,
  external: [
    "vscode",
  ],
  // Bundle workspace packages so they're included in the extension
  noExternal: [
    /^@ucdjs\//,
  ],
  inlineOnly: false,
  plugins: [
    {
      name: "copy-grammars-to-syntaxes",
      async buildStart() {
        for (const file of allGrammarFiles) {
          const fileName = file.split("/").pop()!;
          const grammar = await loadGrammarFile(file);

          await this.fs.writeFile(`./syntaxes/${fileName}`, `${JSON.stringify(grammar, null, 2)}\n`);
        }

        await syncContributedGrammars();
      },
    },
  ],
});
