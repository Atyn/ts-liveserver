import TypeScript from 'typescript'
import Path from 'path'
import Fs from 'fs'

type TransformFunction = (filePath: string) => Promise<string>

export default class Deployer {
	private transformFunction: TransformFunction
	private buildedFiles: Set<string> = new Set()
	private outputDirectory: string
	constructor(outputDirectory: string, transformFunction: TransformFunction) {
		this.outputDirectory = Path.resolve(outputDirectory)
		this.transformFunction = transformFunction
	}
	public async deployFiles(filePaths: string[]): Promise<string[]> {
		for (const filePath of filePaths) {
			await this.deployFile(filePath)
		}
		return Array.from(this.buildedFiles)
	}
	private async deployFile(filePath: string) {
		const resolvedFilePath = Path.resolve(filePath)
		if (this.buildedFiles.has(resolvedFilePath)) {
			return
		}
		this.buildedFiles.add(resolvedFilePath)
		const outputText = await this.transformFunction(resolvedFilePath)
		this.writeFile(resolvedFilePath, outputText)
		for (const referedFile of this.getReferencedFiles(
			resolvedFilePath,
			outputText,
		)) {
			const resolvedReferedFile = Path.resolve(referedFile)
			this.deployFile(resolvedReferedFile)
		}
	}
	private getReferencedFiles(fromFile: string, code: string): string[] {
		const directory = Path.dirname(fromFile)
		const information = TypeScript.preProcessFile(code)
		return information.importedFiles
			.map((info) => info.fileName)
			.map((fileName) => Path.resolve(directory, fileName))
	}
	private async writeFile(filePath: string, code: string) {
		const outputPath = Path.resolve(
			this.outputDirectory,
			Path.relative(process.cwd(), filePath),
		)
		await Fs.promises.mkdir(Path.dirname(outputPath), { recursive: true })
		await Fs.promises.writeFile(outputPath, code)
	}
}
