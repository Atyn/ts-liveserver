/* eslint-disable */

import CommonJsTransformer from './transformers/CommonJsTransformer'
import ResolveTransformer from './transformers/ResolveTransformer'
import CompilerOptions from './CompilerOptions'
import TypeScript from 'typescript'
import Fs from 'fs'

// const filePath = '../../test.js'
const filePath = '../../test.ts'
// const filePath = '../../XPathCSSGenerator.js'
// const filePath = './packages/test-environment/src/Test.js'
// const filePath = './packages/test-environment/src/ReactIndex.js'
// const filePath = './node_modules/react-dom/index.js'
// const filePath = '../../node_modules/react-dom/cjs/react-dom.development.js' // './lzString.js'

const transformers: TypeScript.CustomTransformers = {
	before: [
		(context) => new CommonJsTransformer(context),
		// (context) => new ResolveTransformer(context),
	],
}

async function main() {
	const content = (await Fs.promises.readFile(filePath)).toString()
	await Fs.promises.writeFile(
		'./tmp/out.js',
		await transformWithPlugin(content),
	)
}

main()

async function transformWithPlugin(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: CompilerOptions,
		fileName: filePath,
		transformers: transformers,
	})
	return results.outputText.trim()
}

async function transformWithoutPlugin(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: CompilerOptions,
		fileName: filePath,
	})
	return results.outputText.trim()
}
