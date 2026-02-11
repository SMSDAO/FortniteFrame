import next from 'eslint-config-next/core-web-vitals';

const config = [
  ...(Array.isArray(next) ? next : [next]),
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      'artifacts/**',
      'cache/**',
      'typechain-types/**',
    ],
  },
];

export default config;
