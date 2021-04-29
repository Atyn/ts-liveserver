import Fs from 'fs'
import Path from 'path'
import TypeScript from 'typescript'

export default class LanguageServiceHost
	implements TypeScript.LanguageServiceHost {
	private compilerOptions: TypeScript.CompilerOptions
	private customTransformers?: TypeScript.CustomTransformers
	private compilerHost: TypeScript.CompilerHost
	private files: Record<string, string> = {}
	constructor(
		compilerOptions: TypeScript.CompilerOptions,
		customTransformers?: TypeScript.CustomTransformers,
	) {
		this.compilerOptions = compilerOptions
		this.customTransformers = customTransformers
		this.compilerHost = TypeScript.createCompilerHost(this.compilerOptions)
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
	readFile(path: string) {
		return this.compilerHost.readFile(path)
	}
	fileExists(path: string) {
		return this.compilerHost.fileExists(path)
	}
	getDefaultLibFileName = (options: TypeScript.CompilerOptions) =>
		TypeScript.getDefaultLibFilePath(options)

	log(s: string) {
		console.log(s)
	}
	trace(s: string) {
		console.log(s)
	}
	error(s: string) {
		console.log(s)
	}
}
