// @ts-check
import { ESLintUtils } from "@typescript-eslint/utils";

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    hasSuggestions: true,
    messages: {
      hardcodedOpenApiTags: "Avoid hardcoded OpenAPI tags in the code.",
    },
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type !== "Identifier" || callee.name !== "createRoute" || !node.arguments.length) {
          return;
        }

        const firstArg = node.arguments[0];

        if (
          firstArg == null || firstArg.type !== "ObjectExpression" || !firstArg.properties || firstArg.properties.some((prop) =>
            prop.type === "Property"
            && prop.key.type === "Identifier"
            && prop.key.name === "tags"
            && prop.value.type === "ArrayExpression")) {
          return;
        }

        const tagsProperty = firstArg.properties.find(
          (prop) =>
            prop.type === "Property"
            && prop.key.type === "Identifier"
            && prop.key.name === "tags",
        );

        if (tagsProperty == null || tagsProperty.value.type !== "ArrayExpression") {
          return;
        }

        for (const element of tagsProperty.value.elements) {
          if (element.type !== "Literal" || typeof element.value !== "string") {
            continue;
          }

          context.report({
            node: element,
            messageId: "hardcodedOpenApiTags",
            suggest: [
              {
                messageId: "hardcodedOpenApiTags",
                fix(fixer) {
                  return fixer.replaceText(
                    element,
                    `OPENAPI_TAGS.${element.value.toUpperCase()}`,
                  );
                },
              },
            ],
          });
        }
      },
    };
  },
});
