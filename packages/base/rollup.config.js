// // import peerDepsExternal from 'rollup-plugin-peer-deps-external';
// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import typescript from '@rollup/plugin-typescript';
// import glob from 'glob';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
//
// // this override is needed because Module format cjs does not support top-level await
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const packageJson = require('./package.json');
//
// const globals = {
//   ...packageJson.devDependencies
// };
// const nodeResolve = resolve({
//   preferBuiltins: false,
//   mainFields: ['module', 'jsnext:main', 'browser']
// });
//
// export default {
//   input: Object.fromEntries(
//     glob.sync('src/**/*.ts').map(file => [
//       // This remove `src/` as well as the file extension from each
//       // file, so e.g. src/nested/foo.js becomes nested/foo
//       path.relative(
//         'src',
//         file.slice(0, file.length - path.extname(file).length)
//       ),
//       // This expands the relative paths to absolute paths, so e.g.
//       // src/nested/foo becomes /project/src/nested/foo.js
//       fileURLToPath(new URL(file, import.meta.url))
//     ])
//   ),
//   output: [
//     {
//       dir: 'build',
//       format: 'cjs', // commonJS
//       sourcemap: true
//     }
//     // {
//     //   file: packageJson.module,
//     //   format: 'esm', // ES Modules
//     //   sourcemap: true,
//     // },
//   ],
//   plugins: [
//     // peerDepsExternal(),
//     // resolve({
//     //   preferBuiltins: false,
//     //   mainFields: ['browser'],
//     // }),
//     // commonjs(),
//     resolve(),
//     typescript({
//       // useTsconfigDeclarationDir: true,
//       // tsconfigOverride: {
//       //   exclude: ['**/*.stories.*'],
//       // },
//     })
//     // commonjs({
//     //   exclude: 'node_modules',
//     //   ignoreGlobal: true,
//     // }),
//   ]
//   // external: Object.keys(globals),
// };
//
// // Other useful plugins you might want to add are:
// // @rollup/plugin-images - import image files into your components
// // @rollup/plugin-json - import JSON files into your components
// // rollup-plugin-terser - minify the Rollup bundle
