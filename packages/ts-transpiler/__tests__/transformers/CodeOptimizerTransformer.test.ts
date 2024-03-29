import CodeOptimizerTransformer from '../../src/transformers/CodeOptimizerTransformer'
import TypeScript from 'typescript'

process.env.NODE_ENV = 'development'
describe('CodeOptimizerTransformer', () => {
	it('Should handle null', async () => {
		const input =
			'if(null) { console.log("do not show"); } else { console.log("show");}'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should handle empty string', async () => {
		const input =
			'if("") { console.log("do not show"); } else { console.log("show");}'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should handle true', async () => {
		const input = 'if(true) { console.log("hello"); }'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should handle false', async () => {
		const input =
			'if(false) { console.log("do not show"); } else { console.log("show");}'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should remove "use strict"', async () => {
		const input = '"use strict"; console.log("hello")'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should be "true"', async () => {
		const input = '"a" === "b"'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should remove if it is the same', async () => {
		const input =
			'if ("astring" === "astring") { console.log("hello"); } else { console.log("never happens")}'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should remove if statement if it is never the same', async () => {
		const input =
			'if ("something else" === "astring") { console.log("hello"); } else { console.log("always happens")}'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should empty functions in root scope', async () => {
		const input = '(function () { console.log("yoyo") })();'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should handle nested binary expressions', async () => {
		const input = '("a" === "a") === true'
		expect(await transformWithPlugin(input)).toMatchSnapshot()
	})
	it('Should combine optimizations', async () => {
		const input = `(function () {
			"a" === "b";
		})();`
		expect(await transformWithPlugin(input)).toMatchSnapshot()
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
