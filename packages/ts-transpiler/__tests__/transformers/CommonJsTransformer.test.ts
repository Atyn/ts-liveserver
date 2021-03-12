import CommonJsTransformer from '../../src/transformers/CommonJsTransformer'
import TypeScript from 'typescript'

describe('CommonJsTransformer', () => {
	it('Should convert to default export to ES6', async () => {
		const input = 'module.exports = {};'
		const output = 'export default {};'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert to default export to ES6', async () => {
		const input = 'module.exports = {};'
		const output = 'export default {};'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert default import to ES6', async () => {
		const input = 'const Hello = require("./hello.ts");'
		const output = 'import Hello from "./hello.ts";'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert simple import', async () => {
		const input = 'require("./hello.ts");'
		const output = 'import "./hello.ts";'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert named import', async () => {
		const input = 'const { Hello } = require("./hello.ts");'
		const output = 'import { Hello } from "./hello.ts";'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert to default export to ES6', async () => {
		const input = 'module.exports.hello = Hello;'
		const output = 'export { Hello as hello };'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert exports.name', async () => {
		const input = 'exports.hello = Hello;'
		const output = 'export { Hello as hello };'
		expect(await transform(input)).toBe(output)
	})
	it('Should convert exports.default', async () => {
		const input = 'exports.default = Hello;'
		const output = 'export default Hello;'
		expect(await transform(input)).toBe(output)
	})
})

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsx: TypeScript.JsxEmit.React,
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: true,
	pretty: true,
	allowUnreachableCode: true,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: false,
}

const transformers: TypeScript.CustomTransformers = {
	after: [(context) => new CommonJsTransformer(context)],
}

async function transform(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: compilerOptions,
		fileName: 'hello.ts',
		transformers: transformers,
	})
	return results.outputText.trim()
}
