import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'

/**
 * @returns {import('esbuild').Plugin}
 */
function patchCjsInterop() {
  return {
    name: 'patch-cjs-interop',
    setup(build) {
      build.onEnd(async () => {
        let outfile = './dist/index.mjs'

        let content = await fs.promises.readFile(outfile)

        // Prepend `createRequire`
        let code = [
          `import {createRequire} from 'module'`,
          `import {dirname as __global__dirname__} from 'path'`,
          `import {fileURLToPath} from 'url'`,

          // CJS interop fixes
          `const require=createRequire(import.meta.url)`,
          `const __filename=fileURLToPath(import.meta.url)`,
          `const __dirname=__global__dirname__(__filename)`,
        ]

        content = `${code.join('\n')}\n${content}`

        fs.promises.writeFile(outfile, content)
      })
    },
  }
}

/**
 * @returns {import('esbuild').Plugin}
 */
function copyTypes() {
  return {
    name: 'copy-types',
    setup(build) {
      build.onEnd(() =>
        fs.promises.copyFile(
          path.resolve(__dirname, './src/index.d.ts'),
          path.resolve(__dirname, './dist/index.d.ts'),
        ),
      )
    },
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let context = await esbuild.context({
  bundle: true,
  platform: 'node',
  target: 'node14.21.3',
  external: ['prettier'],
  minify: process.argv.includes('--minify'),
  entryPoints: [path.resolve(__dirname, './src/index.js')],
  outfile: path.resolve(__dirname, './dist/index.mjs'),
  format: 'esm',
  plugins: [patchCjsInterop(), copyTypes()],
})

await context.rebuild()

if (process.argv.includes('--watch')) {
  await context.watch()
}

await context.dispose()
