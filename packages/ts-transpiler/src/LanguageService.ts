import TypeScript from 'typescript'
import DependencyResolver from './DependencyResolver'
import LanguageServiceHost from './LanguageServiceHost'

type Options = {
	dependencyResolver: DependencyResolver
	compilerOptions: TypeScript.CompilerOptions
	transformers: TypeScript.CustomTransformers
}

export default class LanguageService {
	private languageService: TypeScript.LanguageService
	private languageServiceHost: LanguageServiceHost
	constructor(options: Options) {
		this.languageServiceHost = new LanguageServiceHost(options)
		this.languageService = TypeScript.createLanguageService(
			this.languageServiceHost,
			TypeScript.createDocumentRegistry(),
		)
	}
	public fileExists(path: string) {
		return this.languageServiceHost.fileExists(path)
	}
	public transformFile(filePath: string): Promise<TypeScript.TranspileOutput> {
		this.languageServiceHost.addFile(filePath)
		const emitResult = this.languageService.getEmitOutput(
			filePath,
			false,
			false,
		)
		return Promise.resolve({
			outputText: emitResult.outputFiles[0].text,
		})
	}
}
