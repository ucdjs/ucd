import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { FetchError, FetchSchemaValidationError } from "../../src/fetch/error";
import { customFetch } from "../../src/fetch/fetch";

describe("custom fetch - schema validation", () => {
  const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.email(),
  });

  const UsersListSchema = z.array(UserSchema);

  const validUser = { id: 1, name: "John Doe", email: "john@example.com" };
  const validUsersList = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Doe", email: "jane@example.com" },
  ];

  describe("successful validation", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/user`, () => {
          return HttpResponse.json(validUser);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/users`, () => {
          return HttpResponse.json(validUsersList);
        }],
      ]);
    });

    it("should return validated data when schema matches", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/user`, {
        schema: UserSchema,
      });

      expect(result.data).toEqual(validUser);
      expect(result.status).toBe(200);
    });

    it("should validate array responses", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/users`, {
        schema: UsersListSchema,
      });

      expect(result.data).toEqual(validUsersList);
      expect(result.data).toHaveLength(2);
    });

    it("should work with safe method and valid data", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/user`, {
        schema: UserSchema,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(validUser);
    });
  });

  describe("validation failures", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/invalid-user`, () => {
          return HttpResponse.json({ id: "not-a-number", name: 123 });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/invalid-email`, () => {
          return HttpResponse.json({ id: 1, name: "John", email: "not-an-email" });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/missing-fields`, () => {
          return HttpResponse.json({ id: 1 });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/null-response`, () => {
          return HttpResponse.json(null);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/server-error`, () => {
          return HttpResponse.json({ message: "oops" }, { status: 500 });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/error-valid`, () => {
          return HttpResponse.json({ error: "bad" }, { status: 400 });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/error-invalid`, () => {
          return HttpResponse.json({ error: 123 }, { status: 400 });
        }],
      ]);
    });

    it("should throw error when schema validation fails", async () => {
      await expect(
        customFetch(`${UCDJS_API_BASE_URL}/invalid-user`, {
          schema: UserSchema,
        }),
      ).rejects.toThrow("Response validation failed");
    });

    it("should throw error for invalid email format", async () => {
      await expect(
        customFetch(`${UCDJS_API_BASE_URL}/invalid-email`, {
          schema: UserSchema,
        }),
      ).rejects.toThrow("Response validation failed");
    });

    it("should throw error for missing required fields", async () => {
      await expect(
        customFetch(`${UCDJS_API_BASE_URL}/missing-fields`, {
          schema: UserSchema,
        }),
      ).rejects.toThrow("Response validation failed");
    });

    it("should return error in safe method when validation fails", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/invalid-user`, {
        schema: UserSchema,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(FetchSchemaValidationError);
      expect(result.error?.message).toContain("Response validation failed");
    });

    it("should include validation issues in error cause", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/invalid-user`, {
        schema: UserSchema,
      });

      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(FetchSchemaValidationError);
      expect(result.error?.cause).toBeDefined();
      expect((result.error?.cause as any)?.name).toBe("ZodError");
      expect((result.error as FetchSchemaValidationError).issues).toBeDefined();
    });

    it("should surface schema validation error even on error responses when payload mismatches schema", async () => {
      await expect(
        customFetch(`${UCDJS_API_BASE_URL}/server-error`, {
          schema: UserSchema,
        }),
      ).rejects.toBeInstanceOf(FetchError);
    });

    it("should return schema validation error via safe fetch on error responses when payload mismatches schema", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/server-error`, {
        schema: UserSchema,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(FetchError);
      expect(result.error).not.toBeInstanceOf(FetchSchemaValidationError);
    });

    it("should validate error responses and still throw FetchError when schema passes", async () => {
      const ErrorSchema = z.object({ error: z.string() });

      await expect(
        customFetch(`${UCDJS_API_BASE_URL}/error-valid`, {
          schema: ErrorSchema,
        }),
      ).rejects.toBeInstanceOf(FetchError);
    });

    it("should emit FetchSchemaValidationError when error response fails schema", async () => {
      const ErrorSchema = z.object({ error: z.string() });

      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/error-invalid`, {
        schema: ErrorSchema,
      });

      expect(result.error).toBeInstanceOf(FetchError);
      expect(result.error).not.toBeInstanceOf(FetchSchemaValidationError);
    });
  });

  describe("schema with defaults and transforms", () => {
    const SchemaWithDefaults = z.object({
      id: z.number(),
      name: z.string(),
      role: z.string().default("user"),
      tags: z.array(z.string()).default([]),
    });

    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/partial-data`, () => {
          return HttpResponse.json({ id: 1, name: "John" });
        }],
      ]);
    });

    it("should apply schema defaults to missing fields", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/partial-data`, {
        schema: SchemaWithDefaults,
      });

      expect(result.data).toEqual({
        id: 1,
        name: "John",
        role: "user",
        tags: [],
      });
    });
  });

  describe("schema with coercion", () => {
    const CoercedSchema = z.object({
      id: z.coerce.number(),
      active: z.coerce.boolean(),
    });

    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/string-values`, () => {
          return HttpResponse.json({ id: "42", active: "true" });
        }],
      ]);
    });

    it("should coerce string values to correct types", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/string-values`, {
        schema: CoercedSchema,
      });

      expect(result.data).toEqual({
        id: 42,
        active: true,
      });
      expect(typeof result.data?.id).toBe("number");
      expect(typeof result.data?.active).toBe("boolean");
    });
  });

  describe("without schema", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/any-data`, () => {
          return HttpResponse.json({ anything: "goes", nested: { value: 123 } });
        }],
      ]);
    });

    it("should return raw data when no schema is provided", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/any-data`);

      expect(result.data).toEqual({ anything: "goes", nested: { value: 123 } });
    });

    it("should not validate when schema is undefined", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/any-data`, {
        schema: undefined,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ anything: "goes", nested: { value: 123 } });
    });
  });

  describe("edge cases", () => {
    const EmptyArraySchema = z.array(z.string());
    const NullableSchema = z.object({
      value: z.string().nullable(),
    });

    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/empty-array`, () => {
          return HttpResponse.json([]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/nullable-field`, () => {
          return HttpResponse.json({ value: null });
        }],
      ]);
    });

    it("should validate empty arrays", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/empty-array`, {
        schema: EmptyArraySchema,
      });

      expect(result.data).toEqual([]);
    });

    it("should validate nullable fields", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/nullable-field`, {
        schema: NullableSchema,
      });

      expect(result.data).toEqual({ value: null });
    });
  });
});
