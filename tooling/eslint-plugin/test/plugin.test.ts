import { RuleTester } from "eslint";
import { it } from "vitest";
import rule from "../src/rules/no-hardcoded-openapi-tags.js";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

it("validates the rule with RuleTester", () => {
  tester.run("no-hardcoded-openapi-tags", rule, {
    valid: [
      `createRoute({ tags: [OPENAPI_TAGS.FILES] });`,
      `createRoute({ tags: [someTag] });`,
      `otherCall({ tags: ["Files"] });`,
    ],
    invalid: [
      {
        code: `createRoute({ tags: ["Files"] });`,
        errors: [{
          message: "Use OPENAPI_TAGS constant instead of hardcoded string 'Files'.",
        }],
        output: `createRoute({ tags: [OPENAPI_TAGS.FILES] });`,
      },
      {
        code: `createRoute({ tags: ["Unicode Data"] });`,
        errors: [{
          message: "Use OPENAPI_TAGS constant instead of hardcoded string 'Unicode Data'.",
        }],
        output: `createRoute({ tags: [OPENAPI_TAGS.UNICODE_DATA] });`,
      },
    ],
  });
});
