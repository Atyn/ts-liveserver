import CodeOptimizerTransformer from '../../src/transformers/CodeOptimizerTransformer'
import TypeScript from 'typescript'

describe('CodeOptimizerTransformer', () => {
	it('Should remove if statement', async () => {
		process.env.NODE_ENV = 'development'
		const input =
			'if ("astring" === "astring") { console.log("hello"); } else { console.log("never happens")}'
		const output = 'console.log("hello")'
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
	before: [(context) => new CodeOptimizerTransformer(context)],
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
