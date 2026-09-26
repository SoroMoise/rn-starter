import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const config = [
  ...coreWebVitals,
  ...typescript,
  prettier,
  { ignores: ['.next/**', 'out/**', 'next-env.d.ts'] },
]

export default config
