import Fs from 'fs'
import TypeScript from 'typescript'
import CompilerOptions from './CompilerOptions'
import AllTransformers from './AllTransformers'
export default class TsTranspiler {
	async transformCode(
		code: string,
		fileName: string,
	): Promise<TypeScript.TranspileOutput> {
		const results = TypeScript.transpileModule(code, {
			compilerOptions: CompilerOptions,
			fileName: fileName,
			reportDiagnostics: true,
			transformers: AllTransformers,
		})
		if (results.diagnostics?.length) {
			// eslint-disable-next-line no-console
			console.log(results.diagnostics)
		}
		return results
	}
	async transformFile(fileName: string): Promise<TypeScript.TranspileOutput> {
		const buffer = await Fs.promises.readFile(fileName)
		return this.transformCode(buffer.toString(), fileName)
	}
}
