// https://commitlint.js.org/
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type 必须是以下之一
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档变更
        'style',    // 代码格式（不影响逻辑）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建系统/工具链
        'ci',       // CI 配置
        'chore',    // 其他杂项
        'revert',   // 回滚
        'widget',   // Widget 开发（自定义）
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 100],
    // scope 不强制但如果写了要小写
    'scope-case': [2, 'always', 'lower-case'],
    // header 总长不超过 120
    'header-max-length': [2, 'always', 120],
    // body 不强制行长（VS Code / AI 生成的描述往往较长）
    'body-max-line-length': [0],
  },
};
