// describe("repairUCDFiles", () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it("should download only missing files", async () => {
//     const testdirPath = await testdir({
//       "v16.0.0": {
//         "UnicodeData.txt": "existing content",
//       },
//     });

//     // Mock the proxy response for the missing file
//     mockFetch([
//       ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/Blocks.txt", () => {
//         return new Response("Blocks content");
//       }],
//     ]);

//     const result = await repairUCDFiles("16.0.0", ["Blocks.txt"], {
//       basePath: testdirPath,
//     });

//     expect(result.success).toBe(true);
//     expect(result.repairedFiles).toEqual(["Blocks.txt"]);
//     expect(result.errors).toEqual([]);
//   });

//   it("should handle empty missing files array", async () => {
//     const testdirPath = await testdir({});

//     const result = await repairUCDFiles("16.0.0", [], {
//       basePath: testdirPath,
//     });

//     expect(result.success).toBe(true);
//     expect(result.repairedFiles).toEqual([]);
//     expect(result.errors).toEqual([]);
//   });

//   it("should handle download errors gracefully", async () => {
//     const testdirPath = await testdir({
//       "v16.0.0": {},
//     });

//     mockFetch([
//       ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/NonExistent.txt", () => {
//         return new Response(null, { status: 404, statusText: "Not Found" });
//       }],
//     ]);

//     const result = await repairUCDFiles("16.0.0", ["NonExistent.txt"], {
//       basePath: testdirPath,
//     });

//     expect(result.success).toBe(false);
//     expect(result.repairedFiles).toEqual([]);
//     expect(result.errors).toHaveLength(1);
//     expect(result.errors[0]?.message).toContain("Failed to fetch NonExistent.txt");
//     expect(result.errors[0]?.file).toBe("NonExistent.txt");
//   });

//   it("should handle nested file paths correctly", async () => {
//     const testdirPath = await testdir({
//       "v16.0.0": {},
//     });

//     mockFetch([
//       ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/emoji/emoji-data.txt", () => {
//         return new Response("emoji data content");
//       }],
//     ]);

//     const result = await repairUCDFiles("16.0.0", ["emoji/emoji-data.txt"], {
//       basePath: testdirPath,
//     });

//     expect(result.success).toBe(true);
//     expect(result.repairedFiles).toEqual(["emoji/emoji-data.txt"]);
//     expect(result.errors).toEqual([]);
//   });

//   it("should return error when version is not provided", async () => {
//     const testdirPath = await testdir({});

//     const result = await repairUCDFiles("", ["SomeFile.txt"], {
//       basePath: testdirPath,
//     });

//     expect(result.success).toBe(false);
//     expect(result.repairedFiles).toEqual([]);
//     expect(result.errors).toEqual([{ message: "Version is required for repair" }]);
//   });

//   it("should use custom filesystem adapter", async () => {
//     const testdirPath = await testdir({});

//     const mockFs = {
//       readFile: vi.fn().mockResolvedValue("test content"),
//       mkdir: vi.fn().mockResolvedValue(undefined),
//       ensureDir: vi.fn().mockResolvedValue(undefined),
//       writeFile: vi.fn().mockResolvedValue(undefined),
//       exists: vi.fn().mockResolvedValue(true),
//       readdir: vi.fn().mockResolvedValue([]),
//     } satisfies FSAdapter;

//     mockFetch([
//       ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/TestFile.txt", () => {
//         return new Response("test file content");
//       }],
//     ]);

//     const result = await repairUCDFiles("16.0.0", ["TestFile.txt"], {
//       basePath: testdirPath,
//       fs: mockFs,
//     });

//     expect(result.success).toBe(true);
//     expect(mockFs.mkdir).toHaveBeenCalledWith(`${testdirPath}/v16.0.0`, { recursive: true });
//     expect(mockFs.writeFile).toHaveBeenCalledWith(
//       `${testdirPath}/v16.0.0/TestFile.txt`,
//       "test file content",
//     );
//   });

//   it("should use custom proxy URL", async () => {
//     const testdirPath = await testdir({
//       "v16.0.0": {},
//     });

//     const customProxyUrl = "https://custom-proxy.example.com";

//     mockFetch([
//       [`GET ${customProxyUrl}/16.0.0/ucd/CustomFile.txt`, () => {
//         return new Response("custom content");
//       }],
//     ]);

//     const result = await repairUCDFiles("16.0.0", ["CustomFile.txt"], {
//       basePath: testdirPath,
//       proxyUrl: customProxyUrl,
//     });

//     expect(result.success).toBe(true);
//     expect(result.repairedFiles).toEqual(["CustomFile.txt"]);
//   });
// });

// describe("integration - validate and repair workflow", () => {
//   it("should validate files and repair missing ones", async () => {
//     const testdirPath = await testdir({
//       "v16.0.0": {
//         "UnicodeData.txt": "existing content",
//         // Missing Blocks.txt and emoji files
//       },
//     });

//     const MOCK_FILES = [
//       { name: "UnicodeData.txt", path: "UnicodeData.txt" },
//       { name: "Blocks.txt", path: "Blocks.txt" },
//       { name: "emoji", path: "emoji", children: [
//         { name: "emoji-data.txt", path: "emoji-data.txt" },
//       ] },
//     ];

//     // Mock API response for validation
//     mockFetch([
//       ["GET https://api.ucdjs.dev/api/v1/files/16.0.0", () => {
//         return HttpResponse.json(MOCK_FILES);
//       }],
//       // Mock proxy responses for repair
//       ["GET https://api.ucdjs.dev/api/v1/unicode-proxy/16.0.0/ucd/Blocks.txt", () => {
//         return new Response("Blocks.txt content");
//       }],
//       ["GET https://api.ucdjs.dev/api/v1/unicode-proxy/16.0.0/ucd/emoji/emoji-data.txt", () => {
//         return new Response("emoji-data.txt content");
//       }],
//     ]);

//     // Step 1: Validate and find missing files
//     const validationResult = await validateUCDFiles("16.0.0", {
//       basePath: testdirPath,
//     });

//     expect(validationResult.missingFiles).toEqual([
//       "Blocks.txt",
//       "emoji/emoji-data.txt",
//     ]);

//     // Step 2: Repair by downloading only the missing files
//     const repairResult = await repairUCDFiles("16.0.0", validationResult.missingFiles, {
//       basePath: testdirPath,
//     });

//     expect(repairResult.success).toBe(true);
//     expect(repairResult.repairedFiles).toEqual([
//       "Blocks.txt",
//       "emoji/emoji-data.txt",
//     ]);
//     expect(repairResult.errors).toEqual([]);

//     // Step 3: Validate again to confirm all files are now present
//     const finalValidationResult = await validateUCDFiles("16.0.0", {
//       basePath: testdirPath,
//     });

//     expect(finalValidationResult.missingFiles).toEqual([]);
//   });
// });
