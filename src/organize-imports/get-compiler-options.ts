import { dirname } from 'path'
import ts from 'typescript'
import { memoize } from './memoize'

/**
 * Get the compiler options from the path to a tsconfig.
 */
export const getCompilerOptions = memoize((tsconfig?: string) => {
  const compilerOptions = tsconfig
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(tsconfig, ts.sys.readFile).config,
        ts.sys,
        dirname(tsconfig),
      ).options
    : ts.getDefaultCompilerOptions()

  compilerOptions.allowJs = true // for automatic JS support

  return compilerOptions
})