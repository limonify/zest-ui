import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/**
 * The demos on these pages are the real components, running through
 * `react-native-web`. Three things are needed for that:
 *
 * - `react-native` has to resolve to `react-native-web`, which is the whole
 *   trick — every `View`, `Pressable` and `Modal` zest imports becomes its web
 *   counterpart.
 * - `.web.js` has to win over `.js`, because that is how React Native packages
 *   ship their web variants.
 * - zest itself is consumed from source. Its `exports` map hands anything that
 *   is not Metro the compiled `lib/`, which would mean building the package
 *   before the docs; pointing at `src/` keeps the demos on whatever is checked
 *   out, and `transpilePackages` compiles the TypeScript.
 */
const reactNativeAliases = {
  'react-native': 'react-native-web',
  '@limonify/zest-ui': '../../packages/zest-ui/src/index.ts',
};

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: [
    'react-native-web',
    'react-native-gesture-handler',
    '@limonify/zest-ui',
  ],
  turbopack: {
    resolveAlias: reactNativeAliases,
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'react-native$': 'react-native-web',
    };
    webpackConfig.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...webpackConfig.resolve.extensions,
    ];
    return webpackConfig;
  },
};

export default withMDX(config);
