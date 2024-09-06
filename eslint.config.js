import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  rules: {
    'unused-imports/no-unused-vars': 'off',
    'no-console': 'off',
  },
})
