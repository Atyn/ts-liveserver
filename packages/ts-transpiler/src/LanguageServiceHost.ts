import Fs from 'fs'
import TypeScript from 'typescript'
import DependencyResolver from './DependencyResolver'
import ModuleResolutionHost from './ModuleResolutionHost'

type Options = {
	dependencyResolver: DependencyResolver
	compilerOptions: TypeScript.CompilerOptions
	transformers: TypeScript.CustomTransformers
}
export default class LanguageServiceHost
	implements TypeScript.LanguageServiceHost {
	private dependencyResolver: DependencyResolver
	private compilerOptions: TypeScript.CompilerOptions
	private customTransformers?: TypeScript.CustomTransformers
	private files: Record<string, string> = {}
	constructor(options: Options) {
		this.compilerOptions = Object.assign({}, options.compilerOptions, {
			declaration: false,
			isolatedModules: true,
			outDir: 'tmp/hello',
			baseUrl: '.',
			traceResolution: false,
			noEmitOnError: false,
			checkJs: true,
			downlevelIteration: true,
			esModuleInterop: true,
			alwaysStrict: false,
			noStrictGenericChecks: true,
			noResolve: true,
			skipLibCheck: true,
			resolveJsonModule: true,
			noLib: true,
			forceConsistentCasingInFileNames: true,
			skipDefaultLibCheck: true,
		})
		this.dependencyResolver = options.dependencyResolver
		this.customTransformers = options.transformers
	}
	readDirectory = TypeScript.sys.readDirectory
	directoryExists = TypeScript.sys.directoryExists
	getDirectories = TypeScript.sys.getDirectories
	addFile(filePath: string) {
		this.files[filePath] = this.getScriptVersion(filePath)
	}
	getCustomTransformers = () => {
		// eslint-disable-next-line no-invalid-this
		return this.customTransformers
	}
	// eslint-disable-next-line no-invalid-this
	getScriptFileNames = () => Object.keys(this.files)
	getScriptVersion = (filePath: string): string => {
		const info = Fs.statSync(filePath)
		return info.mtimeMs.toString()
	}
	getScriptSnapshot = (fileName: string) => {
		if (!Fs.existsSync(fileName)) {
			return undefined
		}
		return TypeScript.ScriptSnapshot.fromString(
			Fs.readFileSync(fileName).toString(),
		)
	}
	getCurrentDirectory = () => process.cwd()
	getCompilationSettings = () => {
		// eslint-disable-next-line no-invalid-this
		return this.compilerOptions
	}
	fileExists = (fileName: string): boolean => {
		return TypeScript.sys.fileExists(fileName)
	}
	readFile = (fileName: string): string | undefined => {
		return TypeScript.sys.readFile(fileName)
	}
	getDefaultLibFileName = (options: TypeScript.CompilerOptions) =>
		TypeScript.getDefaultLibFilePath(options)
	resolveModuleNames(
		moduleNames: string[],
		containingFile: string,
	): (TypeScript.ResolvedModule | undefined)[] {
		const isDtsFile = /\.d\.ts$/.test(containingFile)
		if (isDtsFile) {
			return moduleNames.map((moduleName) => {
				const result = TypeScript.resolveModuleName(
					moduleName,
					containingFile,
					this.compilerOptions,
					new ModuleResolutionHost(),
				)
				return result.resolvedModule
			})
		}
		return moduleNames.map((moduleName) => {
			const resolveResults = this.dependencyResolver.resolveDependencyPath(
				containingFile,
				moduleName,
			)
			if (resolveResults.ignore) {
				return undefined
			}
			return {
				resolvedFileName: resolveResults.path,
				isExternalLibraryImport: false,
			}
		})
	}
	resolveTypeReferenceDirectives(
		typeReferenceDirectiveNames: string[],
		containingFile: string,
	): (TypeScript.ResolvedTypeReferenceDirective | undefined)[] {
		return typeReferenceDirectiveNames.map((typeReferenceDirectiveName) => {
			const result = TypeScript.resolveTypeReferenceDirective(
				typeReferenceDirectiveName,
				containingFile,
				this.compilerOptions,
				new ModuleResolutionHost(),
			)
			return result.resolvedTypeReferenceDirective
		})
	}
}
