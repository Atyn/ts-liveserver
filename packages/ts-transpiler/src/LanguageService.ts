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
		const program = this.languageService.getProgram()
		if (program) {
			const sourceFile = program.getSourceFile(filePath)
			const statements = sourceFile?.statements || []
			for (const statement of statements) {
				if (
					TypeScript.isImportDeclaration(statement) &&
					statement.importClause?.namedBindings &&
					TypeScript.isNamedImports(statement.importClause.namedBindings)
				) {
					for (const element of statement.importClause.namedBindings.elements) {
						if (TypeScript.isImportSpecifier(element)) {
							const typeChecker = program.getTypeChecker()
							const symbol = typeChecker.getSymbolAtLocation(element.name)
							console.log(symbol?.declarations)
							console.log('calue:', symbol?.valueDeclaration)
							console.log('exports:', symbol?.exports)

							if (symbol) {
								// console.log(typeChecker.getDeclaredTypeOfSymbol(symbol))
							}
						}
					}
				}
			}
		}
		const emitResult = this.languageService.getEmitOutput(
			filePath,
			false,
			false,
		)
		return Promise.resolve({
			outputText: emitResult.outputFiles[0].text,
		})
		/*
		return Promise.resolve(
			this.optimizeCode(emitResult.outputFiles[0].text, filePath),
		)
		*/
	}
	public optimizeCode(
		code: string,
		filePath: string,
	): TypeScript.TranspileOutput {
		const program = this.languageService.getProgram()

		TypeScript.createUnparsedSourceFile(code)
		const results = TypeScript.transpileModule(code, {
			compilerOptions: {},
			fileName: filePath,
			transformers: {
				before: [(context) => (node) => node],
			},
		})
		return results
	}
}
