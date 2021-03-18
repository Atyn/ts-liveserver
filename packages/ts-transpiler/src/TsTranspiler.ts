import Fs from 'fs'
import TypeScript from 'typescript'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'
import NodeEnvTransformer from './transformers/NodeEnvTransformer'
import CodeOptimizerTransformer from './transformers/CodeOptimizerTransformer'

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
	skipLibCheck: false,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: true,
}

const transformers: TypeScript.CustomTransformers = {
	before: [
		(context) => new NodeEnvTransformer(context),
		(context) => new CodeOptimizerTransformer(context),
	],
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
		const results = TypeScript.transpileModule(code, {
			compilerOptions: compilerOptions,
			fileName: fileName,
			reportDiagnostics: true,
			transformers: transformers,
		})
		if (results.diagnostics?.length) {
			console.log(results.diagnostics)
		}
		return results.outputText
	}
	async transformFile(fileName: string): Promise<Buffer | string> {
		const buffer = await Fs.promises.readFile(fileName)
		return this.transformCode(buffer.toString(), fileName)
	}
}
