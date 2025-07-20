// @ts-check
import { ESLintUtils } from "@typescript-eslint/utils";

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    hasSuggestions: true,
    messages: {
      "no-hardcoded-openapi-tags": "Use OPENAPI_TAGS constant instead of hardcoded string '{{tag}}'.",
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

        if (firstArg?.type !== "ObjectExpression" || !firstArg.properties) {
          return;
        }

        const tagsProperty = firstArg.properties.find(
          (prop) =>
            prop.type === "Property"
            && prop.key.type === "Identifier"
            && prop.key.name === "tags",
        );

        if (!tagsProperty || tagsProperty.type !== "Property" || tagsProperty.value.type !== "ArrayExpression") {
          return;
        }

        for (const element of tagsProperty.value.elements) {
          if (element?.type !== "Literal" || typeof element.value !== "string") {
            continue;
          }

          const tagValue = element.value;
          const constantName = tagValue.toUpperCase().replace(/[^A-Z0-9]/g, "_");

          context.report({
            node: element,
            messageId: "no-hardcoded-openapi-tags",
            data: {
              tag: tagValue,
            },
            fix(fixer) {
              return fixer.replaceText(
                element,
                `OPENAPI_TAGS.${constantName}`,
              );
            },
          });
        }
      },
    };
  },
});
