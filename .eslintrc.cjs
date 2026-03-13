module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        'patterns': [
          'packages/thingsvis-ui/src/*',
          'packages/thingsvis-kernel/src/*',
          'packages/thingsvis-schema/src/*'
        ]
      }
    ]
  }
};


