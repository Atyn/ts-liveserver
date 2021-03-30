import EnsureExportDefaultTransformer from '../../src/transformers/EnsureExportDefaultTransformer'
import TypeScript from 'typescript'

describe('EnsureExportDefaultTransformer', () => {
	it('Should have default export redirects', async () => {
		const input = 'export default interface Hello { yo: string }'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should not add default export', async () => {
		const input = 'export default class Hello { yo: string }'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should not add default export', async () => {
		const input = 'export { a as default }'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should not add default export', async () => {
		const input = 'export default hello'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
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
	after: [(context) => new EnsureExportDefaultTransformer(context)],
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
