// @ts-check
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // 不启用 project 选项，避免 CI 中因 tsconfig 路径问题拖慢速度
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // ── 禁止裸 console.log（已在 TASK-07 清理过）──
    'no-console': ['error', { allow: ['warn', 'error', 'group', 'groupEnd', 'groupCollapsed'] }],

    // ── 空语句块：设置为 warn（空 catch 块是常见 pattern）──
    'no-empty': ['warn', { allowEmptyCatch: true }],

    // ── finally 块中的 return 降为 warn ──
    'no-unsafe-finally': 'warn',

    // ── 这些是代码质量项，但不是逻辑 bug，降为 warn ──
    'no-useless-catch': 'warn',
    'no-extra-semi': 'warn',

    // ── TypeScript ──
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // @ts-ignore → @ts-expect-error 降为 warn（存量代码不强制）
    '@typescript-eslint/ban-ts-comment': 'warn',
    // require() 引入降为 warn
    '@typescript-eslint/no-require-imports': 'warn',

    // ── React ──
    'react/react-in-jsx-scope': 'off',   // React 17+ JSX transform 不需要 import React
    'react/prop-types': 'off',            // TypeScript 已处理 prop 类型
    'react/display-name': 'off',

    // ── React Hooks ──
    'react-hooks/rules-of-hooks': 'error',  // 条件 Hook 调用是真实 bug，保持 error
    'react-hooks/exhaustive-deps': 'warn',

    // ── 关闭错误应用的 Next.js 规则（studio 使用 rsbuild，非 Next.js）──
    '@next/next/no-img-element': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.cjs',
    '*.config.ts',
    'public/',
  ],
};
