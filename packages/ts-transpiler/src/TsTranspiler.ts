import Fs from 'fs'
import TypeScript from 'typescript'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsxFactory: 'react',
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: true,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: true,
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
		return results.outputText
	}
	async transformFile(fileName: string): Promise<Buffer | string> {
		const buffer = await Fs.promises.readFile(fileName)
		return this.transformCode(buffer.toString(), fileName)
	}
}
