import Path from 'path'
import Resolve from 'enhanced-resolve'
import IEsmDependencyResolver from '../types/IEsmDependencyResolver'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.mjs']

export default class DependencyResolver implements IEsmDependencyResolver {
	private resolver = Resolve.create.sync({
		mainFields: ['browser', 'module', 'main'],
		extensions: RESOLVE_EXTENSIONS,
		aliasFields: ['browser'],
	})
	private alias?: Record<string, string>
	constructor(alias: Record<string, string> = {}) {
		this.alias = alias
	}
	// Return e.g. ./hello/module.js
	public resolveDependencyName(
		parentFilePath: string,
		dependencyName: string,
	): string {
		const absolutePath = this.resolveDependencyPath(
			parentFilePath,
			dependencyName,
		)
		const pathObj = Path.parse(absolutePath)
		const relativeDir =
			Path.relative(Path.dirname(parentFilePath), pathObj.dir) || '.'
		const result = relativeDir + '/' + pathObj.name + '.js'
		const posixResult = Path.posix.normalize(result).replace(/\\/g, '/')
		return posixResult.startsWith('.') ? posixResult : './' + posixResult
	}
	// Return an absolute path e.g. /tmp/a-apath/node_modules/hello/module.js
	public resolveDependencyPath(
		parentFilePath: string,
		dependencyName: string,
	): string {
		if (this.alias && dependencyName in this.alias) {
			return this.resolveDependencyPath(
				parentFilePath,
				this.alias[dependencyName],
			)
		}
		const result = this.resolver(
			{},
			Path.dirname(parentFilePath),
			dependencyName,
		)
		if (result === false) {
			throw new Error(
				`Could not resolve "${dependencyName}" from ${parentFilePath}`,
			)
		}
		return result
	}
}
