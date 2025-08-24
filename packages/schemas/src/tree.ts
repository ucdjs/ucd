import { dedent } from "@luxass/utils";
import { z } from "zod";

const BaseTreeNodeSchema = z.object({
  name: z.string().describe("The name of the file or directory."),
  path: z.string().describe("The path to the file or directory."),
  lastModified: z.number().optional().describe("The last modified date of the directory, if available."),
});

export const UnicodeTreeNodeSchema: z.ZodType<{
  type: "directory" | "file";
  name: string;
  path: string;
  lastModified?: number;
  children?: any[];
}> = z.union([
  BaseTreeNodeSchema.extend({
    type: z.literal("directory").describe("The type of the entry, which is a directory."),
    children: z.array(z.lazy(() => UnicodeTreeNodeSchema)).describe("The children of the directory."),
  }),
  BaseTreeNodeSchema.extend({
    type: z.literal("file").describe("The type of the entry, which is a file."),
  }),
]).meta({
  description: dedent`
    Represents a node in a Unicode file tree structure.
    
    This schema defines either a directory with children or a file entry,
    used for representing hierarchical file structures in Unicode data.
  `,
});

export type UnicodeTreeNode = z.infer<typeof UnicodeTreeNodeSchema>;

export const UnicodeTreeSchema = z.array(UnicodeTreeNodeSchema).meta({
  description: "A tree structure representing Unicode files and directories.",
});

export type UnicodeTree = z.infer<typeof UnicodeTreeSchema>;