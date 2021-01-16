import Fs from 'fs'
import Path from 'path'
import TypeScript from 'typescript'
import ResolveFactory from '../src/transformer-factories/ResolveFactory'

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsxFactory: 'react',
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: false,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
}

// const compilerHost = TypeScript.createCompilerHost(compilerOptions)

const transformers: TypeScript.CustomTransformers = {
	after: [
		ResolveFactory
	],
}

export default class FileServer {
	async getContent(path: string): Promise<Buffer | string> {
		const filePath = Path.resolve('.' + path)
		console.log('----', filePath)
		const buffer = await Fs.promises.readFile(filePath)
		const results = await TypeScript.transpileModule(buffer.toString(), {
			compilerOptions: compilerOptions,
			fileName: filePath,
			// reportDiagnostics: true,
			// renamedDependencies: {},
			transformers: transformers,
		})
		return results.outputText
	}
}
