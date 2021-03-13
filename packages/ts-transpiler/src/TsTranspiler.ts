import * as Fs from 'fs'
import * as TypeScript from 'typescript'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsx: TypeScript.JsxEmit.React,
	/*
	jsx: TypeScript.JsxEmit.React,
	jsxImportSource: 'react',
	jsxFragmentFactory: 'React.Fragment',
	jsxFactory: 'React.createElement',
	*/
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: true,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: false,
}

const transformers: TypeScript.CustomTransformers = {
	after: [
		(context) => new CommonJsTransformer(context),
		(context) => new ResolveTransformer(context),
	],
}

export default class TsTranspiler {
	async transformCode(
		code: string,
		fileName: string,
	): Promise<Buffer | string> {
		const results = await TypeScript.transpileModule(code, {
			compilerOptions: compilerOptions,
			fileName: fileName,
			// reportDiagnostics: true,
			// renamedDependencies: {},
			transformers: transformers,
		})
		return results.outputText.toString().replace('export {}', 'export default {}')
	}
	async transformFile(fileName: string): Promise<Buffer | string> {
		const buffer = await Fs.promises.readFile(fileName)
		return this.transformCode(buffer.toString(), fileName)
	}
}
