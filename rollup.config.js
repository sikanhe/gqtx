import ts from '@rollup/plugin-typescript'
import { promises as fs } from "fs"

const isCJSBuild = process.env.MODE === "cjs" 

const commonjsPkgJSONPlugin = () => {
  return {
    name: 'commonjsPkgJSONPlugin',
    writeBundle: async  () => {
      if (isCJSBuild === true) {
        await fs.writeFile("dist/cjs/package.json", JSON.stringify({
          "type": "commonjs"
        }))
      } else {
        await fs.copyFile("package.json", "dist/package.json")
      }
    }
  }
}

export default {
  input: ['src/index.ts', 'src/relay.ts'],
  output: [
    {
      dir: isCJSBuild ? 'dist/cjs' : 'dist',
      format: isCJSBuild ? 'cjs' : 'esm'
    }
  ],
  plugins: [ts({ tsconfig: isCJSBuild ? "tsconfig.cjs.json" : "tsconfig.json" }), commonjsPkgJSONPlugin()],
  external: ["graphql"]
}
