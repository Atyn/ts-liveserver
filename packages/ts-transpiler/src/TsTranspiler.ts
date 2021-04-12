import Fs from 'fs'
import Path from 'path'
import TypeScript from 'typescript'
import CompilerOptions from './CompilerOptions'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'
import NodeEnvTransformer from './transformers/NodeEnvTransformer'
import CodeOptimizerTransformer from './transformers/CodeOptimizerTransformer'
import EnsureExportDefaultTransformer from './transformers/EnsureExportDefaultTransformer'
import InternalDependencyReducer from './transformers/InternalDependencyReducer'
import DependencyResolver from './DependencyResolver'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json']
type Options = {
	compilerOptions?: TypeScript.CompilerOptions
	resolveAlias?: Record<string, string>
}
export default class TsTranspiler {
	private compilerOptions: TypeScript.CompilerOptions = CompilerOptions
	private transformers: TypeScript.CustomTransformers
	constructor(options?: Options) {
		const dependencyResolver = new DependencyResolver(options?.resolveAlias)
		Object.assign(this.compilerOptions, options?.compilerOptions)
		this.transformers = {
			before: [
				(context) => new NodeEnvTransformer(context),
				(context) => new InternalDependencyReducer(context),
				(context) => new CodeOptimizerTransformer(context),
				(context) => new CommonJsTransformer(context),
				(context) => new ResolveTransformer(context, dependencyResolver),
			],
			after: [(context) => new EnsureExportDefaultTransformer(context)],
		}
	}
	async transformCode(
		code: string,
		fileName: string,
	): Promise<TypeScript.TranspileOutput> {
		const results = TypeScript.transpileModule(code, {
			compilerOptions: this.compilerOptions,
			fileName: fileName,
			reportDiagnostics: true,
			transformers: this.transformers,
		})
		if (results.diagnostics?.length) {
			// eslint-disable-next-line no-console
			console.log('diagnostics:', results.diagnostics)
		}
		return results
	}
	public async transformFile(
		fileName: string,
	): Promise<TypeScript.TranspileOutput> {
		if (Path.extname(fileName) === '.json') {
			const fileContent =
				'export default ' + (await Fs.promises.readFile(fileName))
			return {
				outputText: fileContent,
			}
		}
		const buffer = await Fs.promises.readFile(fileName)
		return {
			...(await this.transformCode(buffer.toString(), fileName)),
		}
	}
	public async resolveFilePath(fileName: string): Promise<string> {
		if (await this.fileExists(Path.resolve(fileName))) {
			return Path.resolve(fileName)
		}
		const parsedFileName = Path.parse(fileName)
		for (const extension of RESOLVE_EXTENSIONS) {
			if (
				await this.fileExists(
					Path.resolve(parsedFileName.dir, parsedFileName.name + extension),
				)
			) {
				return Path.resolve(parsedFileName.dir, parsedFileName.name + extension)
			}
		}
		throw new Error('Could not find file' + fileName)
	}
	private async fileExists(path: string) {
		try {
			await Fs.promises.stat(path)
		} catch (error) {
			return false
		}
		return true
	}
}
