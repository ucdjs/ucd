import type { CLIArguments } from "../../cli-utils";
import { existsSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { RawDataFile } from "@luxass/unicode-utils/data-files";
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
          ["--openai-key (-k)", "The OpenAI API key to use."],
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

  const resolvedInputFile = path.resolve(inputPath);

  if (!existsSync(resolvedInputFile)) {
    console.error(`invalid input path: ${inputPath}. Please provide a valid input path.`);
    return;
  }

  const outputDir = flags.outputDir || path.join(path.dirname(resolvedInputFile), ".codegen");

  // check whether or not the input path is a directory or a file
  const isDirectory = (await stat(resolvedInputFile)).isDirectory();

  const files = [];

  if (isDirectory) {
    const dir = await readdir(resolvedInputFile, {
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
    files.push(resolvedInputFile);
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

    const fileName = path.basename(file);

    return writeFile(
      path.join(outputDir, fileName).replace(/\.txt$/, ".ts"),
      code,
      "utf-8",
    );
  });

  await Promise.all(promises);
  // eslint-disable-next-line no-console
  console.log(`Generated fields for ${files.length} files.`);
}
