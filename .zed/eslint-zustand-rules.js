// ESLint Custom Rules for Zustand v5 Compatibility
// Add these rules to your ESLint configuration to catch problematic patterns

module.exports = {
  rules: {
    // Detect object returns in useStore selectors without useShallow
    'zustand-object-selector-shallow': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require useShallow for object destructuring in Zustand selectors',
          category: 'Possible Errors',
          recommended: true
        },
        fixable: 'code',
        messages: {
          missingUseShallow: 'Object destructuring in useStore selector requires useShallow to prevent infinite loops in Zustand v5+',
          addUseShallowImport: 'Add useShallow import: import { useShallow } from "zustand/react/shallow"'
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            // Check for useStore calls with object returns
            if (
              node.callee.name === 'useStore' &&
              node.arguments.length > 0 &&
              node.arguments[0].type === 'ArrowFunctionExpression'
            ) {
              const arrowFunction = node.arguments[0];

              // Check if returning an object literal
              if (
                arrowFunction.body.type === 'ObjectExpression' ||
                (arrowFunction.body.type === 'BlockStatement' &&
                 arrowFunction.body.body.some(stmt =>
                   stmt.type === 'ReturnStatement' &&
                   stmt.argument?.type === 'ObjectExpression'
                 ))
              ) {
                // Check if useShallow is already used
                const hasUseShallow = node.arguments.some(arg =>
                  arg.type === 'CallExpression' &&
                  arg.callee.name === 'useShallow'
                );

                if (!hasUseShallow) {
                  context.report({
                    node,
                    messageId: 'missingUseShallow',
                    suggest: [
                      {
                        desc: 'Wrap with useShallow',
                        fix(fixer) {
                          const selectorArg = context.getSourceCode().getText(node.arguments[0]);
                          return fixer.replaceText(
                            node.arguments[0],
                            `useShallow(${selectorArg})`
                          );
                        }
                      }
                    ]
                  });
                }
              }
            }
          }
        };
      }
    },

    // Detect array methods in selectors
    'zustand-no-array-methods-in-selector': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent array methods in Zustand selectors that create new references',
          category: 'Possible Errors',
          recommended: true
        },
        messages: {
          noArrayMethods: 'Array methods ({{method}}) in selectors create new references. Move to useMemo in component.'
        }
      },
      create(context) {
        const arrayMethods = ['map', 'filter', 'reduce', 'slice', 'concat', 'sort', 'reverse'];

        return {
          CallExpression(node) {
            // Check for useStore calls
            if (node.callee.name === 'useStore' && node.arguments.length > 0) {
              const selector = node.arguments[0];

              // Walk the selector to find array method calls
              context.getSourceCode().visitorKeys.CallExpression.forEach(key => {
                if (selector[key]) {
                  const checkForArrayMethods = (astNode) => {
                    if (astNode.type === 'CallExpression' &&
                        astNode.callee.type === 'MemberExpression' &&
                        arrayMethods.includes(astNode.callee.property.name)) {
                      context.report({
                        node: astNode,
                        messageId: 'noArrayMethods',
                        data: {
                          method: astNode.callee.property.name
                        }
                      });
                    }
                  };

                  // Recursively check for array methods
                  context.getSourceCode().traverse(selector, {
                    CallExpression: checkForArrayMethods
                  });
                }
              });
            }
          }
        };
      }
    },

    // Detect computed values in selectors
    'zustand-no-computations-in-selector': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prevent computations in Zustand selectors that could cause performance issues',
          category: 'Best Practices',
          recommended: true
        },
        messages: {
          noComputations: 'Avoid computations in selectors. Consider moving to useMemo or computed hook.'
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name === 'useStore' && node.arguments.length > 0) {
              const selector = node.arguments[0];

              // Check for object expressions with computed properties
              if (selector.type === 'ArrowFunctionExpression' &&
                  selector.body.type === 'ObjectExpression') {

                selector.body.properties.forEach(prop => {
                  if (prop.value.type === 'CallExpression' ||
                      (prop.value.type === 'MemberExpression' &&
                       ['reduce', 'length', 'map', 'filter'].includes(prop.value.property?.name))) {
                    context.report({
                      node: prop,
                      messageId: 'noComputations'
                    });
                  }
                });
              }
            }
          }
        };
      }
    },

    // Ensure useShallow import when needed
    'zustand-require-use-shallow-import': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require useShallow import when using object destructuring patterns',
          category: 'Possible Errors',
          recommended: true
        },
        fixable: 'code',
        messages: {
          missingImport: 'Missing useShallow import. Add: import { useShallow } from "zustand/react/shallow"'
        }
      },
      create(context) {
        let hasUseShallowImport = false;
        let hasUseShallowUsage = false;

        return {
          ImportDeclaration(node) {
            if (node.source.value === 'zustand/react/shallow') {
              const hasUseShallowSpecifier = node.specifiers.some(spec =>
                spec.type === 'ImportSpecifier' && spec.imported.name === 'useShallow'
              );
              if (hasUseShallowSpecifier) {
                hasUseShallowImport = true;
              }
            }
          },

          Identifier(node) {
            if (node.name === 'useShallow') {
              hasUseShallowUsage = true;
            }
          },

          'Program:exit'() {
            if (hasUseShallowUsage && !hasUseShallowImport) {
              context.report({
                node: context.getSourceCode().ast,
                messageId: 'missingImport',
                fix(fixer) {
                  // Add import at the top of the file
                  const firstNode = context.getSourceCode().ast.body[0];
                  return fixer.insertTextBefore(
                    firstNode,
                    'import { useShallow } from "zustand/react/shallow";\n'
                  );
                }
              });
            }
          }
        };
      }
    }
  },

  configs: {
    recommended: {
      rules: {
        'zustand-object-selector-shallow': 'error',
        'zustand-no-array-methods-in-selector': 'error',
        'zustand-no-computations-in-selector': 'warn',
        'zustand-require-use-shallow-import': 'error'
      }
    }
  }
};

// Usage Instructions:
// 1. Save this file as .eslintrc-zustand.js in your project
// 2. Add to your .eslintrc.js:
//
//    module.exports = {
//      extends: [
//        // your existing extends
//        './.eslintrc-zustand.js'
//      ],
//      rules: {
//        // Enable Zustand-specific rules
//        'zustand-object-selector-shallow': 'error',
//        'zustand-no-array-methods-in-selector': 'error',
//        'zustand-no-computations-in-selector': 'warn',
//        'zustand-require-use-shallow-import': 'error'
//      }
//    };
//
// 3. Or use the recommended config:
//    extends: ['./.eslintrc-zustand.js/recommended']

// Example patterns these rules will catch:

/*
// ❌ Will trigger 'zustand-object-selector-shallow'
const { user, loading } = useStore(state => ({
  user: state.user,
  loading: state.loading
}));

// ✅ Fixed version
const { user, loading } = useStore(useShallow(state => ({
  user: state.user,
  loading: state.loading
})));

// ❌ Will trigger 'zustand-no-array-methods-in-selector'
const filteredItems = useStore(state => state.items.filter(item => item.active));

// ✅ Fixed version
const items = useStore(state => state.items);
const filteredItems = useMemo(() => items.filter(item => item.active), [items]);

// ❌ Will trigger 'zustand-no-computations-in-selector'
const computed = useStore(state => ({
  total: state.items.reduce((sum, item) => sum + item.value, 0),
  count: state.items.length
}));

// ✅ Fixed version
const items = useStore(state => state.items);
const computed = useMemo(() => ({
  total: items.reduce((sum, item) => sum + item.value, 0),
  count: items.length
}), [items]);
*/
