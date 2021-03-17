import NodeEnvTransformer from '../../src/transformers/NodeEnvTransformer'
import TypeScript from 'typescript'

describe('NodeEnvTransformer', () => {
	it('Should replace process.env.NODE_ENV with "production"', async () => {
		process.env.NODE_ENV = 'production'
		const input = 'process.env.NODE_ENV;'
		const output = '"production";'
		expect(await transformWithPlugin(input)).toBe(
			await transformWithoutPlugin(output),
		)
	})
	it('Should replace process.env.NODE_ENV with "development"', async () => {
		process.env.NODE_ENV = 'development'
		const input = 'process.env.NODE_ENV;'
		const output = '"development";'
		expect(await transformWithPlugin(input)).toBe(
			await transformWithoutPlugin(output),
		)
	})
	it('Should replace process.env.NODE_ENV with "development" in if-statement', async () => {
		process.env.NODE_ENV = 'development'
		const input =
			'if (process.env.NODE_ENV === "development") { console.log("yo"); }'
		const output = 'if ("development" === "development") { console.log("yo"); }'
		expect(await transformWithPlugin(input)).toBe(
			await transformWithoutPlugin(output),
		)
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
	before: [(context) => new NodeEnvTransformer(context)],
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
