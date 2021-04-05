import Path from 'path'
import Resolve from 'enhanced-resolve'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.mjs']

export default class DependencyResolver {
	private resolver = Resolve.create.sync({
		mainFields: ['browser', 'module', 'main'],
		extensions: RESOLVE_EXTENSIONS,
		aliasFields: ['browser'],
	})
	private fileName: string
	constructor(fileName: string) {
		this.fileName = fileName
	}
	public resolveRelativeDependency(dependencyFileName: string): string {
		return this.resolveDependencyName(this.fileName, dependencyFileName)
	}
	// Return e.g. ./hello/module.js
	private resolveDependencyName(
		parentPath: string,
		dependencyName: string,
	): string {
		const absolutePath = this.resolveDependencyPath(parentPath, dependencyName)
		const pathObj = Path.parse(absolutePath)
		const relativeDir =
			Path.relative(Path.dirname(parentPath), pathObj.dir) || '.'
		const result = relativeDir + '/' + pathObj.name + '.js'
		const posixResult = Path.posix.normalize(result).replace(/\\/g, '/')
		return posixResult.startsWith('.') ? posixResult : './' + posixResult
	}
	// Return an aboslute path e.g. /tmp/a-apath/node_modules/hello/module.js
	private resolveDependencyPath(
		parentPath: string,
		dependencyName: string,
	): string {
		const directory = Path.dirname(parentPath)
		const result = this.resolver({}, directory, dependencyName)
		if (result === false) {
			throw new Error(
				'Could not resolve ' + dependencyName + ' from ' + parentPath,
			)
		}
		return result
	}
}
