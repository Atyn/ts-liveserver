import Fs from 'fs'
import Path from 'path'
import TypeScript from 'typescript'
import CompilerOptions from './CompilerOptions'
import AllTransformers from './AllTransformers'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json']

export default class TsTranspiler {
	private compilerOptions: TypeScript.CompilerOptions = CompilerOptions
	constructor(compilerOptions?: TypeScript.CompilerOptions) {
		Object.assign(this.compilerOptions, compilerOptions)
	}
	async transformCode(
		code: string,
		fileName: string,
	): Promise<TypeScript.TranspileOutput> {
		const results = TypeScript.transpileModule(code, {
			compilerOptions: this.compilerOptions,
			fileName: fileName,
			reportDiagnostics: true,
			transformers: AllTransformers,
		})
		if (results.diagnostics?.length) {
			// eslint-disable-next-line no-console
			console.log('diagnostics:', results.diagnostics)
		}
		return results
	}
	public async transformFile(
		fileName: string,
	): Promise<TypeScript.TranspileOutput & { resolvedFilePath: string }> {
		const resolvedFilePath = await this.resolveFilePath(fileName)
		if (Path.extname(resolvedFilePath) === '.json') {
			const fileContent =
				'export default ' + (await Fs.promises.readFile(resolvedFilePath))
			return {
				outputText: fileContent,
				resolvedFilePath: resolvedFilePath,
			}
		}
		const buffer = await Fs.promises.readFile(resolvedFilePath)
		return {
			...(await this.transformCode(buffer.toString(), resolvedFilePath)),
			resolvedFilePath: resolvedFilePath,
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
	public async fileExists(path: string) {
		try {
			await Fs.promises.readFile(path)
		} catch (error) {
			return false
		}
		return true
	}
}
