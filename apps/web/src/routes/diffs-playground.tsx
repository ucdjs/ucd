import type { PreloadMultiFileDiffResult } from "@pierre/diffs/ssr";
import { MultiFileDiff } from "@pierre/diffs/react";
import { preloadMultiFileDiff } from "@pierre/diffs/ssr";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Example diff data - static, module-level for performance
const DIFF_EXAMPLES = {
  "typescript-function": {
    label: "TypeScript Function",
    description: "A small function body change",
    oldFile: {
      name: "utils.ts",
      contents: `export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return \`\${year}-\${month}-\${day}\`;
}`,
    },
    newFile: {
      name: "utils.ts",
      contents: `export function formatDate(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}`,
    },
  },
  "json-config": {
    label: "JSON Config",
    description: "Configuration file with added/removed keys",
    oldFile: {
      name: "config.json",
      contents: `{
  "name": "my-app",
  "version": "1.0.0",
  "debug": true,
  "api": {
    "baseUrl": "http://localhost:3000",
    "timeout": 5000
  }
}`,
    },
    newFile: {
      name: "config.json",
      contents: `{
  "name": "my-app",
  "version": "1.1.0",
  "api": {
    "baseUrl": "https://api.example.com",
    "timeout": 10000,
    "retries": 3
  },
  "features": {
    "darkMode": true
  }
}`,
    },
  },
  "markdown-docs": {
    label: "Markdown Docs",
    description: "Documentation text changes",
    oldFile: {
      name: "README.md",
      contents: `# My Project

A simple project for demonstration.

## Installation

Run \`npm install\` to install dependencies.

## Usage

Import and use the main function.`,
    },
    newFile: {
      name: "README.md",
      contents: `# My Project

A powerful library for building modern applications.

## Installation

\`\`\`bash
npm install my-project
# or
pnpm add my-project
\`\`\`

## Quick Start

Import and use the main function:

\`\`\`typescript
import { main } from "my-project";

main();
\`\`\`

## License

MIT`,
    },
  },
  "whitespace-only": {
    label: "Whitespace Only",
    description: "Only whitespace/formatting changes",
    oldFile: {
      name: "style.css",
      contents: `.container{display:flex;justify-content:center;align-items:center;}
.button{padding:8px 16px;border-radius:4px;}`,
    },
    newFile: {
      name: "style.css",
      contents: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.button {
  padding: 8px 16px;
  border-radius: 4px;
}`,
    },
  },
  "no-changes": {
    label: "No Changes",
    description: "Identical files (no diff)",
    oldFile: {
      name: "constants.ts",
      contents: `export const API_VERSION = "v1";
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 5000;`,
    },
    newFile: {
      name: "constants.ts",
      contents: `export const API_VERSION = "v1";
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 5000;`,
    },
  },
} as const;

type ExampleKey = keyof typeof DIFF_EXAMPLES;
type ThemeMode = "light" | "dark" | "system";
type DiffStyle = "split" | "unified";
type Roundedness = "none" | "sm" | "md" | "lg" | "full";

// CSS styles for different roundedness levels - injected via unsafeCSS
const ROUNDEDNESS_STYLES: Record<Roundedness, string> = {
  none: "",
  sm: `
    :host {
      border-radius: 4px;
      overflow: hidden;
    }
    [data-diffs-header] {
      border-radius: 4px 4px 0 0;
    }
    [data-separator='line-info'] [data-separator-wrapper] {
      border-radius: 4px;
    }
  `,
  md: `
    :host {
      border-radius: 8px;
      overflow: hidden;
    }
    [data-diffs-header] {
      border-radius: 8px 8px 0 0;
    }
    [data-separator='line-info'] [data-separator-wrapper] {
      border-radius: 6px;
    }
  `,
  lg: `
    :host {
      border-radius: 12px;
      overflow: hidden;
    }
    [data-diffs-header] {
      border-radius: 12px 12px 0 0;
    }
    [data-separator='line-info'] [data-separator-wrapper] {
      border-radius: 8px;
    }
  `,
  full: `
    :host {
      border-radius: 16px;
      overflow: hidden;
    }
    [data-diffs-header] {
      border-radius: 16px 16px 0 0;
    }
    [data-separator='line-info'] [data-separator-wrapper] {
      border-radius: 999px;
    }
  `,
};

const ROUNDEDNESS_OPTIONS: { value: Roundedness; label: string; description: string }[] = [
  { value: "none", label: "None", description: "Sharp corners" },
  { value: "sm", label: "Small", description: "4px radius" },
  { value: "md", label: "Medium", description: "8px radius" },
  { value: "lg", label: "Large", description: "12px radius" },
  { value: "full", label: "Full", description: "Maximum radius" },
];

// Serializable subset of PreloadMultiFileDiffResult - only the parts we need for hydration
interface SerializablePreloadResult {
  oldFile: { name: string; contents: string };
  newFile: { name: string; contents: string };
  prerenderedHTML: string;
  // Only keep serializable options
  options: {
    theme: { light: string; dark: string };
    diffStyle: "split" | "unified";
  };
}

type PreloadedExamples = Record<
  ExampleKey,
  Record<DiffStyle, SerializablePreloadResult>
>;

// Extract only serializable parts from preload result
function toSerializable(
  result: PreloadMultiFileDiffResult<undefined>,
  diffStyle: DiffStyle,
): SerializablePreloadResult {
  return {
    oldFile: { name: result.oldFile.name, contents: result.oldFile.contents },
    newFile: { name: result.newFile.name, contents: result.newFile.contents },
    prerenderedHTML: result.prerenderedHTML,
    options: {
      theme: { light: "pierre-light", dark: "pierre-dark" },
      diffStyle,
    },
  };
}

// Preload all examples for all theme/style combinations on the server
async function preloadAllExamples(): Promise<PreloadedExamples> {
  const examples = {} as PreloadedExamples;

  for (const [key, example] of Object.entries(DIFF_EXAMPLES)) {
    const exampleKey = key as ExampleKey;

    const splitResult = await preloadMultiFileDiff({
      oldFile: example.oldFile,
      newFile: example.newFile,
      options: {
        theme: { light: "pierre-light", dark: "pierre-dark" },
        diffStyle: "split",
      },
    });

    const unifiedResult = await preloadMultiFileDiff({
      oldFile: example.oldFile,
      newFile: example.newFile,
      options: {
        theme: { light: "pierre-light", dark: "pierre-dark" },
        diffStyle: "unified",
      },
    });

    examples[exampleKey] = {
      split: toSerializable(splitResult, "split"),
      unified: toSerializable(unifiedResult, "unified"),
    };
  }

  return examples;
}

export const Route = createFileRoute("/diffs-playground")({
  component: DiffsPlayground,
  loader: async () => {
    const preloadedExamples = await preloadAllExamples();
    return { preloadedExamples };
  },
  head: () => ({
    meta: [
      { title: "Diffs Playground | UCD.js" },
      { name: "description", content: "Test and explore the @pierre/diffs library with SSR support, theme switching, and roundedness controls." },
    ],
  }),
});

function DiffsPlayground() {
  const { preloadedExamples } = Route.useLoaderData();

  const [selectedExample, setSelectedExample] = useState<ExampleKey>("typescript-function");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [diffStyle, setDiffStyle] = useState<DiffStyle>("split");
  const [roundedness, setRoundedness] = useState<Roundedness>("md");

  const currentExample = DIFF_EXAMPLES[selectedExample];
  const preloadedDiff = preloadedExamples[selectedExample][diffStyle];

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/">Home</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Diffs Playground</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Diffs Playground</h1>
          <p className="text-sm text-muted-foreground">
            Test the @pierre/diffs library with SSR support, theme switching, and roundedness controls for file explorer integration.
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Controls</CardTitle>
            <CardDescription>Configure the diff viewer settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {/* Example Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Example</label>
                <Select
                  value={selectedExample}
                  onValueChange={(value) => setSelectedExample(value as ExampleKey)}
                >
                  <SelectTrigger className="w-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFF_EXAMPLES).map(([key, example]) => (
                      <SelectItem key={key} value={key}>
                        {example.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Theme</label>
                <div className="flex gap-1">
                  <Button
                    variant={themeMode === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThemeMode("light")}
                  >
                    <Sun className="size-4" />
                    Light
                  </Button>
                  <Button
                    variant={themeMode === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThemeMode("dark")}
                  >
                    <Moon className="size-4" />
                    Dark
                  </Button>
                  <Button
                    variant={themeMode === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThemeMode("system")}
                  >
                    System
                  </Button>
                </div>
              </div>

              {/* Diff Style Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Layout</label>
                <div className="flex gap-1">
                  <Button
                    variant={diffStyle === "split" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDiffStyle("split")}
                  >
                    Split
                  </Button>
                  <Button
                    variant={diffStyle === "unified" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDiffStyle("unified")}
                  >
                    Unified
                  </Button>
                </div>
              </div>

              {/* Roundedness Control */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Roundedness</label>
                <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
                  {ROUNDEDNESS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRoundedness(option.value)}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "first:rounded-l-md last:rounded-r-md",
                        roundedness === option.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Description */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {currentExample.label}
            :
          </span>
          {" "}
          {currentExample.description}
        </div>

        {/* Diff Viewer */}
        <Card className={cn(
          "overflow-hidden",
          roundedness === "none" && "rounded-none",
          roundedness === "sm" && "rounded-sm",
          roundedness === "md" && "rounded-md",
          roundedness === "lg" && "rounded-lg",
          roundedness === "full" && "rounded-2xl",
        )}
        >
          <CardContent className="p-0">
            <div data-theme-mode={themeMode}>
              <MultiFileDiff
                {...preloadedDiff}
                options={{
                  ...preloadedDiff.options,
                  themeType: themeMode === "system" ? "system" : themeMode,
                  unsafeCSS: ROUNDEDNESS_STYLES[roundedness],
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* CSS Output Preview */}
        {roundedness !== "none" && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generated CSS</CardTitle>
              <CardDescription>
                CSS injected via
                {" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">unsafeCSS</code>
                {" "}
                option
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                <code>{ROUNDEDNESS_STYLES[roundedness].trim()}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Future Plans Note */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Future Plans</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>TextMate Integration:</strong>
              {" "}
              Custom syntax highlighting using TextMate grammars
              for languages not covered by Shiki's built-in themes.
            </p>
            <p>
              <strong>File Explorer Integration:</strong>
              {" "}
              Embed diff views in the file explorer component
              for comparing Unicode data files across versions.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
