import ResolveTransformer from '../../src/transformers/ResolveTransformer'
import TypeScript from 'typescript'

describe('ResolveTransformer', () => {
	describe('transformSourceFile', () => {
		it('Should convert static import', async () => {
			const input = 'import "./hello.ts";'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert async import', async () => {
			const input = '{ import("./hello.ts") }'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert forward', async () => {
			const input = 'export { default as something } from "../a/b"'
			expect(await transformWithPlugin(input)).toMatchSnapshot()
		})
		it('Should convert named imports', async () => {
			const input = 'import { hello } from "../a/b"; console.log(hello)'
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
	after: [
		(context) =>
			new ResolveTransformer(context, {
				resolveDependencyName: () => 'B',
			}),
	],
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
