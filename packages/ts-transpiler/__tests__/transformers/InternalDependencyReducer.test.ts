import InternalDependencyReducer from '../../src/transformers/InternalDependencyReducer'
import TypeScript from 'typescript'

describe('InternalDependencyReducer', () => {
	it('Should not have try-catch-statement', async () => {
		const input = `
			try {
				var util = require('util');
				if (typeof util.inherits !== 'function') throw '';
				module.exports = util.inherits;
			} catch (e) {
				module.exports = require('./inherits_browser.js');
			}
		`
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
	after: [(context) => new InternalDependencyReducer(context)],
}

async function transformWithPlugin(code: string): Promise<string> {
	const results = await TypeScript.transpileModule(code, {
		compilerOptions: compilerOptions,
		fileName: 'hello.ts',
		transformers: transformers,
	})
	return results.outputText.trim()
}
