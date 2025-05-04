import type { CLIArguments } from "../../cli-utils";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { RawDataFile } from "@luxass/unicode-utils/data-files";
import { toKebabCase } from "@luxass/utils";
import { generateFields } from "@ucdjs/schema-gen";
import { printHelp } from "../../cli-utils";

export interface CLICodegenFieldsCmdOptions {
  flags: CLIArguments<{
    openaiKey?: string;
    outputDir?: string;
  }>;
  inputPath: string;
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
          ["--version", "Show the version number and exit."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line node/prefer-global/process
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

  const outputDir = flags.outputDir || path.join(path.dirname(resolvedInputPath), ".codegen");
  await mkdir(outputDir, { recursive: true });

  // check whether or not the input path is a directory or a file
  const isDirectory = (await stat(resolvedInputPath)).isDirectory();

  const files = [];

  if (isDirectory) {
    const dir = await readdir(resolvedInputPath, {
      withFileTypes: true,
      recursive: true,
    });

    for (const file of dir) {
      if (file.isFile()) {
        if (!file.name.endsWith(".txt")) {
          continue;
        }

        files.push(path.join(file.parentPath, file.name));
      }
    }
  } else {
    files.push(resolvedInputPath);
  }

  const promises = files.map(async (file) => {
    const content = await readFile(file, "utf-8");

    const datafile = new RawDataFile(content);

    if (datafile.heading == null) {
      console.error(`heading for file ${file} is null. Skipping file.`);
      return null;
    }

    const code = await generateFields({
      datafile,
      apiKey: openaiKey,
    });

    if (code == null) {
      console.error(`Error generating fields for file: ${file}`);
      return null;
    }

    const fileName = toKebabCase(path.basename(file)
      .replace(/\.txt$/, "")).toLowerCase();

    return writeFile(
      path.join(outputDir, `${fileName}.ts`),
      code,
      "utf-8",
    );
  });

  await Promise.all(promises);
  // eslint-disable-next-line no-console
  console.log(`Generated fields for ${files.length} files in ${outputDir}`);
}
