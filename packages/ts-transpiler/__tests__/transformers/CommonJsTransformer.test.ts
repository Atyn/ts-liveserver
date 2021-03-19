import CommonJsTransformer from '../../src/transformers/CommonJsTransformer'
import TypeScript from 'typescript'

describe('CommonJsTransformer', () => {
	describe('Import', () => {
		it('Should convert simple import', async () => {
			const input = 'require("./hello.ts")'
			const output = 'import "./hello.ts";'
			expect(await transformWithPlugin(input)).toBe(output)
		})
		it('Should convert default import to ES6', async () => {
			const input = 'const Hello = require("./hello.ts")'
			const output = 'import * as Hello from "./hello.ts";'
			expect(await transformWithPlugin(input)).toBe(output)
		})
		it('Should convert named import', async () => {
			const input = 'const { Hello } = require("./hello.ts")'
			const output = 'import { Hello } from "./hello.ts";'
			expect(await transformWithPlugin(input)).toBe(output)
		})
		it('Should convert require in sub-scope', async () => {
			const input = '{ const hello = require("hello.js") }'
			const output =
				'import * as GENERATED_VAR_BY_TRANSFORMER_1 from "hello.js"; { const hello = GENERATED_VAR_BY_TRANSFORMER_1; }'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
	})
	describe('Forwards', () => {
		it('Should convert redirects', async () => {
			const input = 'module.exports = require("./hello.js")'
			const output = 'export * from "./hello.js";'
			expect(await transformWithPlugin(input)).toBe(output)
		})
	})
	describe('Exports', () => {
		it('Should convert to default export to ES6', async () => {
			const input = 'module.exports = Hello'
			const output = 'export default Hello'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		it('Should convert exports.name', async () => {
			const input = 'exports.hello = Hello'
			const output = 'export { Hello as hello }'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		it('Should convert exports.default', async () => {
			const input = 'exports.default = Hello'
			const output = 'export default Hello'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		/*
		it('Should convert define.property with getter', async () => {
			const input =
				'Object.defineProperty(exports, "hello", { enumerable: true, get: function () { return parts_js_1.PropertyPart; } });'
			const output = 'export { parts_js_1.PropertyPart as hello };'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		*/
		it('Should convert define.property for identifier', async () => {
			const input = 'Object.defineProperty(exports, "a", b });'
			const output = 'export { b as a };'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		it('Should convert define.property', async () => {
			const input = 'module.exports = { a: b, c: d }'
			const output = 'export { b as a, d as c };'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		it('Should convert to default export', async () => {
			const input = 'module.exports.hello = Hello;'
			const output = 'export { Hello as hello };'
			expect(await transformWithPlugin(input)).toBe(output)
		})
	})
})

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsx: TypeScript.JsxEmit.React,
	checkJs: false,
	noResolve: true,
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

async function transformWithPlugin(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: compilerOptions,
		fileName: 'hello.ts',
		transformers: transformers,
	})
	return results.outputText.trim()
}

async function transformWithoutPlugin(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: compilerOptions,
		fileName: 'hello.ts',
	})
	return results.outputText.trim()
}
