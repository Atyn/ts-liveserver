import TypeScript from 'typescript'
import Path from 'path'

export default class DependencyResolver {
	private context: TypeScript.TransformationContext
	private fileName: string
	constructor(fileName: string, context: TypeScript.TransformationContext) {
		this.fileName = fileName
		this.context = context
	}
	public resolveRelativeDependency(dependencyFileName: string): string {
		return this.resolveDependencyName(this.fileName, dependencyFileName)
	}

	// Return e.g. ./hello/module.js
	private resolveDependencyName(
		parentPath: string,
		dendencyName: string,
	): string {
		const absolutePath = this.resolveDependencyPath(parentPath, dendencyName)
		const pathObj = Path.parse(absolutePath)
		const relativeDir =
			Path.relative(Path.dirname(parentPath), pathObj.dir) || '.'
		const result = relativeDir + '/' + pathObj.name + pathObj.ext
		if (result.startsWith('.')) {
			return result.replace(/\.(ts|tsx|jsx)$/, '.js')
		}
		return './' + result.replace(/\.(ts|tsx|jsx)$/, '.js')
	}
	// Return an aboslute path e.g. /tmp/a-apath/node_modules/hello/module.js
	private resolveDependencyPath(
		parentPath: string,
		dendencyName: string,
	): string {
		const resolveResults = TypeScript.resolveModuleName(
			dendencyName,
			parentPath,
			this.context.getCompilerOptions(),
			TypeScript.createCompilerHost(this.context.getCompilerOptions()),
		)
		if (resolveResults?.resolvedModule?.isExternalLibraryImport) {
			const nodeResolve = require.resolve(dendencyName, {
				paths: [Path.dirname(parentPath)],
			})
			if (nodeResolve) {
				return nodeResolve
			}
		}
		const resolvedFileName = resolveResults?.resolvedModule?.resolvedFileName
		if (!resolvedFileName) {
			throw new Error(
				'Could not resolve' + dendencyName + 'from module' + parentPath,
			)
		}
		return resolvedFileName
	}
}
