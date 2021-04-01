import ResolveTransformer from '../../src/transformers/ResolveTransformer'
import DependencyResolver from '../../src/utils/DependencyResolver'
import TypeScript from 'typescript'

describe('ResolveTransformer', () => {
	beforeEach(() => {
		jest
			.spyOn(DependencyResolver.prototype, 'resolveRelativeDependency')
			.mockImplementation(() => 'B')
	})
	describe('transformSourceFile', () => {
		it('Should convert static import', async () => {
			const input = 'import "./hello.ts";'
			const output = 'import "B";'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
		})
		it('Should convert async import', async () => {
			const input = '{ import("./hello.ts"); }'
			const output = '{ import("B"); }'
			expect(await transformWithPlugin(input)).toBe(
				await transformWithoutPlugin(output),
			)
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
	after: [(context) => new ResolveTransformer(context)],
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
