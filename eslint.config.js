// const pulgin = require('@typescript-eslint/recommended');
// const pulgin = require('eslint');
// const plgJasmine = require('jasmine');

module.exports = [
  {
    // 'extends': [
    //   'plugin:@typescript-eslint/recommended',
    //   'eslint:recommended'
    // ],
    // 'env': {
    //   'browser': true,
    //   'es6': true,
    //   'node': true,
    //   'jasmine': true,
    //   'mocha': true
    // },
    'plugins': {
      // jasmine: plgJasmine
//       [
//         'jasmine',
//       'mocha',
//       '@typescript-eslint'
// ]
    },
    // 'parser': '@typescript-eslint/parser',
    // 'parserOptions': {
    //   'project': [
    //     'tsconfig.json',
    //     'tsconfig.lib.json'
    //   ]
    // },
    'rules': {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-types': [
        'off'
      ],
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'off',
        {
          'accessibility': 'explicit'
        }
      ],
      '@typescript-eslint/member-delimiter-style': [
        'error',
        {
          'multiline': {
            'delimiter': 'semi',
            'requireLast': true
          },
          'singleline': {
            'delimiter': 'semi',
            'requireLast': false
          }
        }
      ],
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-inferrable-types': [
        'off',
        {
          'ignoreParameters': true
        }
      ],
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': [
        'off',
        {
          'hoist': 'all'
        }
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/quotes': [
        'error',
        'single',
        {
          'allowTemplateLiterals': true
        }
      ],
      '@typescript-eslint/semi': [
        'error',
        'always'
      ],
      '@typescript-eslint/type-annotation-spacing': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      'no-useless-escape': 'off',
      'no-unused-vars': 'off',
      'no-var-requires': 'off',
      'arrow-body-style': 'error',
      'brace-style': [
        'error',
        '1tbs'
      ],
      'constructor-super': 'error',
      'curly': 'error',
      'dot-notation': 'off',
      'eol-last': 'error',
      'eqeqeq': [
        'error',
        'smart'
      ],
      'guard-for-in': 'error',
      'id-blacklist': 'off',
      'id-match': 'off',
      'import/no-deprecated': 'warn',
      'indent': 'off',
      '@typescript-eslint/indent': [
        'error',
        2,
        {
          'SwitchCase': 1,
          'ignoredNodes': [
            'FunctionExpression > .params[decorators.length > 0]',
            'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
            'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key'
          ]
        }
      ],
      'max-len': [
        'error',
        {
          'code': 140
        }
      ],
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': [
        'error',
        {
          'allow': [
            'log',
            'warn',
            'dir',
            'timeLog',
            'assert',
            'clear',
            'count',
            'countReset',
            'group',
            'groupEnd',
            'table',
            'dirxml',
            'error',
            'groupCollapsed',
            'Console',
            'profile',
            'profileEnd',
            'timeStamp',
            'context'
          ]
        }
      ],
      'no-debugger': 'error',
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-eval': 'error',
      'no-fallthrough': 'error',
      'no-new-wrappers': 'error',
      'no-restricted-imports': [
        'error',
        'rxjs/Rx'
      ],
      'no-shadow': 'off',
      'no-throw-literal': 'error',
      'no-trailing-spaces': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': 'off',
      'no-unused-expressions': 'off',
      'no-unused-labels': 'error',
      'no-use-before-define': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'quotes': [
        2,
        'single'
      ],
      'radix': 'error',
      'semi': 'error',
      'spaced-comment': [
        'error',
        'always',
        {
          'markers': [
            '/'
          ]
        }
      ]
    }
  }
];
