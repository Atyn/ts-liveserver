import Fs from 'fs'
import Path from 'path'
import TypeScript, { Type } from 'typescript'
import CompilerOptions from './CompilerOptions'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'
import NodeEnvTransformer from './transformers/NodeEnvTransformer'
import CodeOptimizerTransformer from './transformers/CodeOptimizerTransformer'
import EnsureExportDefaultTransformer from './transformers/EnsureExportDefaultTransformer'
import InternalDependencyReducer from './transformers/InternalDependencyReducer'
import DependencyResolver from './DependencyResolver'
import LanguageServiceHost from './LanguageServiceHost'

type Options = {
	dependencyResolver: DependencyResolver
	compilerOptions?: TypeScript.CompilerOptions
	transformers: TypeScript.CustomTransformers
}

type TransformOutput = {
	outputText?: string
	diagnostics?: readonly TypeScript.Diagnostic[]
}

export default class LanguageService {
	private dependencyResolver: DependencyResolver
	private documentRegistry = TypeScript.createDocumentRegistry()
	private languageService: TypeScript.LanguageService
	private program: TypeScript.Program
	private languageServiceHost: LanguageServiceHost
	private compilerHost: TypeScript.CompilerHost
	private transformers: TypeScript.CustomTransformers
	private compilerOptions: TypeScript.CompilerOptions = CompilerOptions
	constructor(options: Options) {
		this.dependencyResolver = options.dependencyResolver
		Object.assign(this.compilerOptions, options?.compilerOptions)
		this.transformers = options?.transformers
		this.compilerHost = TypeScript.createCompilerHost(this.compilerOptions)
		this.compilerHost.resolveTypeReferenceDirectives = this.compilerHost.resolveModuleNames?.bind(
			this,
		)
		this.compilerHost.resolveModuleNames = this.resolveModuleNames.bind(this)

		/*
		this.compilerHost.resolveTypeReferenceDirectives = this.resolveModuleNames.bind(
			this,
		)
		*/
		this.program = TypeScript.createProgram({
			rootNames: [],
			options: {
				...this.compilerOptions,
				declaration: false,
				isolatedModules: true,
				outDir: 'tmp/hello',
				baseUrl: '.',
				rootDir: '.',
				traceResolution: true,
				noEmitOnError: false,
				checkJs: true,
				esModuleInterop: true,
				alwaysStrict: false,
				noStrictGenericChecks: true,
				noResolve: true,
				skipLibCheck: true,
				noLib: true,
				skipDefaultLibCheck: true,
				/*
				lib: ['dom', 'ESNext', 'NodeJs'],
				 */
				/*
				noEmit: true,
				*/
			},

			host: this.compilerHost,
		})
	}
	public fileExists(path: string) {
		return this.languageServiceHost.fileExists(path)
	}
	public async transformFile(filePath: string): Promise<TransformOutput> {
		console.log('transformFile:', filePath)
		this.ensureFileIsInProgram(filePath)
		const sourceFile = this.program.getSourceFile(filePath)
		return new Promise((resolve) => {
			const emitResult = this.program.emit(
				sourceFile,
				(fileName: string, data: string) => {
					console.log('compiled:', fileName)
					resolve({
						outputText: data,
						diagnostics: emitResult.diagnostics,
					})
				},
				{
					throwIfCancellationRequested: () => false,
					isCancellationRequested: () => false,
				},
				false,
				// this.transformers,
			)
		})
	}
	private ensureFileIsInProgram(filePath: string): void {
		if (this.program.getSourceFile(filePath)) {
			return
		}
		this.program = TypeScript.createProgram({
			rootNames: [...this.program.getRootFileNames(), filePath],
			options: this.program.getCompilerOptions(),
			host: this.compilerHost,
			oldProgram: this.program,
		})
		console.log(
			'getConfigFileParsingDiagnostics',
			this.formatDiagnostics(this.program.getConfigFileParsingDiagnostics()),
		)
		console.log(
			'getDeclarationDiagnostics',
			this.program.getDeclarationDiagnostics(),
		)
		console.log(
			'getGlobalDiagnostics',
			this.formatDiagnostics(this.program.getGlobalDiagnostics()),
		)
		console.log(
			'getOptionsDiagnostics',
			this.formatDiagnostics(this.program.getOptionsDiagnostics()),
		)

		console.log(
			'getSemanticDiagnostics',
			this.formatDiagnostics(this.program.getSemanticDiagnostics()),
		)
	}
	private formatDiagnostics(diagnostics: readonly TypeScript.Diagnostic[]) {
		return TypeScript.formatDiagnosticsWithColorAndContext(
			diagnostics,
			this.compilerHost,
		)
	}
	private resolveModuleNames(
		moduleNames: string[],
		containingFile: string,
		reusedNames: string[] | undefined,
		redirectedReference: TypeScript.ResolvedProjectReference | undefined,
	): TypeScript.ResolvedModule[] {
		console.log('reusedNames:', reusedNames)
		console.log('redirectedReference:', redirectedReference)
		return moduleNames.map((moduleName) => {
			console.log('moduleName:', moduleName)
			console.log('containingFile:', containingFile)
			console.log(
				'resolved:',
				this.dependencyResolver.resolveDependencyPath(
					containingFile,
					moduleName,
				),
			)
			console.log(
				'isExternalLibraryImport:',
				containingFile.includes(Path.sep + 'node_modules' + Path.sep),
			)
			return {
				resolvedFileName: this.dependencyResolver.resolveDependencyPath(
					containingFile,
					moduleName,
				),
				isExternalLibraryImport: containingFile.includes(
					Path.sep + 'node_modules' + Path.sep,
				),
			}
		})
	}
	private resolveTypeReferenceDirectives(
		typeReferenceDirectiveNames: string[],
		containingFile: string,
	): (TypeScript.ResolvedTypeReferenceDirective | undefined)[] {
		return [undefined]
	}
}
