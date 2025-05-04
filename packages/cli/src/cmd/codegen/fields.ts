import type { CLIArguments } from "../../cli-utils";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { RawDataFile } from "@luxass/unicode-utils/data-files";
import { toKebabCase } from "@luxass/utils";
import { generateFields } from "@ucdjs/schema-gen";
import { printHelp } from "../../cli-utils";

export interface CLICodegenFieldsCmdOptions {
  flags: CLIArguments<{
    openaiKey?: string;
    outputDir?: string;
    bundle?: boolean | string;
  }>;
  inputPath: string;
}

function flattenVersion(version: string): string {
  // split version into parts
  const parts = version.split(".");
  // remove trailing zeros
  while (parts.length > 1 && parts[parts.length - 1] === "0") {
    parts.pop();
  }
  return parts.join(".");
}

export async function runFieldCodegen({ inputPath, flags }: CLICodegenFieldsCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Generate Unicode Data Files",
      commandName: "ucd codegen fields",
      usage: "<input> [...flags]",
      tables: {
        Flags: [
          ["--openai-key (-k)", "The OpenAI API key to use. (can also be set using OPENAI_API_KEY env var)"],
          ["--output-dir", "Specify the output directory for generated files (defaults to .codegen)"],
          ["--bundle <filename>", "Combine generated files into a single file per version. Use {version} placeholder for version-specific naming"],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const openaiKey = flags.openaiKey || process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error("No OpenAI API key provided. Please provide an OpenAI API key.");
    return;
  }

  if (inputPath == null) {
    console.error("No input path provided. Please provide an input path.");
    return;
  }

  const resolvedInputPath = path.resolve(inputPath);

  if (!existsSync(resolvedInputPath)) {
    console.error(`invalid input path: ${inputPath}. Please provide a valid input path.`);
    return;
  }

  const shouldBundle = typeof flags.bundle === "string" || flags.bundle === true;
  const bundleTemplate = typeof flags.bundle === "string" ? flags.bundle : "index.ts";

  // extract output directory from bundle path if it's relative/absolute
  let outputDir = flags.outputDir;
  if (!outputDir) {
    if (shouldBundle && (path.isAbsolute(bundleTemplate) || bundleTemplate.startsWith("./") || bundleTemplate.startsWith("../"))) {
      outputDir = path.dirname(bundleTemplate);
    } else {
      outputDir = path.join(path.dirname(resolvedInputPath), ".codegen");
    }
  }

  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
  }

  // check whether or not the input path is a directory or a file
  const isDirectory = (await stat(resolvedInputPath)).isDirectory();

  // group files by version
  const filesByVersion = new Map<string, string[]>();

  if (isDirectory) {
    const dir = await readdir(resolvedInputPath, {
      withFileTypes: true,
      recursive: true,
    });

    for (const file of dir) {
      if (file.isFile() && file.name.endsWith(".txt")) {
        const filePath = path.join(file.parentPath, file.name);
        // extract version from path (e.g., v16.0.0)
        const versionMatch = filePath.match(/v(\d+\.\d+\.\d+)/);
        const version = versionMatch ? flattenVersion(versionMatch[1]!) : "unknown";

        const files = filesByVersion.get(version) ?? [];
        files.push(filePath);
        filesByVersion.set(version, files);
      }
    }
  } else {
    // single file case - look for version in parent directory name
    const parentDir = path.dirname(resolvedInputPath);
    const versionMatch = parentDir.match(/v(\d+\.\d+\.\d+)/);
    const version = versionMatch ? flattenVersion(versionMatch[1]!) : "unknown";
    filesByVersion.set(version, [resolvedInputPath]);
  }

  // process each version separately
  for (const [version, files] of filesByVersion) {
    const promises = files.map(async (filePath) => {
      const content = await readFile(filePath, "utf-8");
      const datafile = new RawDataFile(content);

      if (datafile.heading == null) {
        console.error(`heading for file ${filePath} is null. Skipping file.`);
        return null;
      }

      const code = await generateFields({
        datafile,
        apiKey: openaiKey,
      });

      if (code == null) {
        console.error(`Error generating fields for file: ${filePath}`);
        return null;
      }

      if (!shouldBundle) {
        const fileName = toKebabCase(path.basename(filePath).replace(/\.txt$/, "")).toLowerCase();
        await writeFile(
          path.join(outputDir, `${fileName}.ts`),
          code,
          "utf-8",
        );
      }

      return {
        code,
        fileName: filePath,
      };
    });

    const generatedCode = await Promise.all(promises);

    if (shouldBundle) {
      let bundledCode = `// This file is generated by ucd codegen. Do not edit this file directly.\n`;
      bundledCode += `// Unicode Version: ${version}\n\n`;

      for (const result of generatedCode.filter(Boolean)) {
        if (!result) continue;
        const relativePath = path.relative(process.cwd(), result.fileName);
        bundledCode += `// #region ${relativePath}\n`;
        bundledCode += result.code;
        bundledCode += `\n// #endregion\n`;
      }

      const bundleFileName = bundleTemplate.replace("{version}", version);
      // handle absolute and relative paths differently than bare filenames
      let bundlePath;
      if (path.isAbsolute(bundleFileName) || bundleFileName.startsWith("./") || bundleFileName.startsWith("../")) {
        bundlePath = path.resolve(bundleFileName);
      } else if (outputDir) {
        bundlePath = path.resolve(path.join(outputDir, bundleFileName));
      } else {
        bundlePath = path.resolve(bundleFileName);
      }

      // ensure .ts extension
      if (!bundlePath.endsWith(".ts")) {
        bundlePath += ".ts";
      }

      // ensure directory exists
      await mkdir(path.dirname(bundlePath), { recursive: true });

      await writeFile(
        bundlePath,
        bundledCode,
        "utf-8",
      );
      // eslint-disable-next-line no-console
      console.log(`Generated bundled fields for Unicode ${version} in ${bundlePath}`);
    }
  }

  if (!shouldBundle) {
    // eslint-disable-next-line no-console
    console.log(`Generated fields for ${Array.from(filesByVersion.values()).flat().length} files in ${outputDir}`);
  }
}
