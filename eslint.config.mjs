import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores([
    '**/.next/**',
    '**/.turbo/**',
    '**/dist/**',
    '**/next-env.d.ts',
    '**/node_modules/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  nextVitals,
  nextTypeScript,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
    settings: {
      next: {
        rootDir: 'apps/studio/',
      },
    },
  },
  prettier,
)
