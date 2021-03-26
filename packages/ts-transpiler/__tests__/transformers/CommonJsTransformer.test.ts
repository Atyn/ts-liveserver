import CommonJsTransformer from '../../src/transformers/CommonJsTransformer'
import TypeScript from 'typescript'

describe('CommonJsTransformer', () => {
	describe('Import', () => {
		it('Should convert simple import', async () => {
			const input = 'require("./hello.ts")'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert default import to ES6', async () => {
			const input = 'let Hello = require("./hello.ts")'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert named import', async () => {
			const input = 'const { Hello } = require("./hello.ts")'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert require in sub-scope', async () => {
			const input = '{ const hello = require("hello.js") }'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
	})
	describe('Forwards', () => {
		it('Should convert redirects', async () => {
			const input = 'module.exports = require("./hello.js")'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert redirects', async () => {
			const input = `
				const WrenchIcon = require('./icons/WrenchIcon.js');
				module.exports = { WrenchIcon }
			`
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
	})
	describe('Exports', () => {
		it('Should convert named export', async () => {
			const input = 'module.exports.hello = Hello;'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert to default export to ES6', async () => {
			const input = 'module.exports = Hello'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert exports.name', async () => {
			const input = 'exports.hello = Hello'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should move exports to top scope', async () => {
			const input = `
					if (typeof define === 'function' && define.amd) {
						define(function () {
							return LZString;
						})
					} else if (typeof module !== 'undefined' && module != null) {
						module.exports = LZString;
					}
			`
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert exports.name with same name as the parameter', async () => {
			const input = 'const hello = null; exports.hello = hello'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert exports.default', async () => {
			const input = 'exports.default = Hello'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert define.property with getter', async () => {
			const input =
				'Object.defineProperty(exports, "hello", { enumerable: true, get: function () { return parts_js_1.PropertyPart; } });'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert define.property for identifier', async () => {
			const input = 'Object.defineProperty(exports, "a", b });'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert define.property with value', async () => {
			const input =
				'Object.defineProperty(exports, "__esModule", { value: true })'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert ObjectLiteralExpression', async () => {
			const input = 'module.exports = { a: b, c: d }'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
	})
	describe('Should read from internal export', () => {
		it('Should convert to multiple commands', async () => {
			const input =
				'exports.lastAttributeNameRegex = exports.createMarker = exports.isTemplatePartActive = void 0'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should red from internal export "hello"', async () => {
			const input = 'exports.hello = "Hello"; console.log(exports.hello)'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
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
	before: [(context) => new CommonJsTransformer(context)],
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
