import Fs from 'fs'
import Path from 'path'
import TypeScript from 'typescript'
import CompilerOptions from './CompilerOptions'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'
import NodeEnvTransformer from './transformers/NodeEnvTransformer'
import CodeOptimizerTransformer from './transformers/CodeOptimizerTransformer'
import InternalDependencyReducer from './transformers/InternalDependencyReducer'
import DependencyResolver from './DependencyResolver'
import LanguageService from './LanguageService'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.mjs']

type Options = {
	compilerOptions?: TypeScript.CompilerOptions
	resolveAlias?: Record<string, string>
}
export default class TsTranspiler {
	private languageService: LanguageService
	private compilerOptions: TypeScript.CompilerOptions = CompilerOptions
	constructor(options?: Options) {
		const dependencyResolver = new DependencyResolver(options?.resolveAlias)
		Object.assign(this.compilerOptions, options?.compilerOptions, {
			rootDir: '../..',
		})
		this.languageService = new LanguageService({
			dependencyResolver: dependencyResolver,
			compilerOptions: this.compilerOptions,
			transformers: {
				before: [
					(context) => new NodeEnvTransformer(context),
					(context) => new CodeOptimizerTransformer(context),
				],
				after: [
					(context) => new CommonJsTransformer(context),
					(context) => new ResolveTransformer(context, dependencyResolver),
				],
			},
		})
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
		return await this.languageService.transformFile(fileName)
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
