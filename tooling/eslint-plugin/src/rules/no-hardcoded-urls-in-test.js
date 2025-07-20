// @ts-check
import { ESLintUtils } from "@typescript-eslint/utils";

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    messages: {
      "no-hardcoded-urls": "Use a constant instead of hardcoded URL '{{url}}'.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(_context) {
    return {};
  },
});
