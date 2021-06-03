import Path from 'path'
import Resolve from 'enhanced-resolve'
import IEsmDependencyResolver from './types/IEsmDependencyResolver'

type ReturnType = {
	path: string
	ignore?: boolean
}

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.mjs']
const ALIAS_FIELDS = ['browser', 'module']
export default class DependencyResolver implements IEsmDependencyResolver {
	private resolver = Resolve.create.sync({
		mainFields: [...ALIAS_FIELDS, 'main'],
		extensions: RESOLVE_EXTENSIONS,
		aliasFields: ALIAS_FIELDS,
	})
	private alias?: Record<string, string>
	constructor(alias: Record<string, string> = {}) {
		this.alias = alias
	}
	// Return e.g. ./hello/module.js
	public resolveDependencyName(
		parentFilePath: string,
		dependencyName: string,
	): ReturnType {
		if (
			dependencyName.startsWith('/') ||
			dependencyName.startsWith('https://') ||
			dependencyName.startsWith('http://')
		) {
			return {
				path: dependencyName,
			}
		}
		const resolveResult = this.resolveDependencyPath(
			parentFilePath,
			dependencyName,
		)
		if (resolveResult.ignore) {
			return resolveResult
		}
		const absolutePath = resolveResult.path
		const pathObj = Path.parse(absolutePath)
		const relativeDir =
			Path.relative(Path.dirname(parentFilePath), pathObj.dir) || '.'
		const result = relativeDir + '/' + pathObj.name + '.js'
		const posixResult = Path.posix.normalize(result).replace(/\\/g, '/')
		return {
			path: posixResult.startsWith('.') ? posixResult : './' + posixResult,
		}
	}
	// Return an absolute path e.g. /tmp/a-apath/node_modules/hello/module.js
	public resolveDependencyPath(
		parentFilePath: string,
		dependencyName: string,
	): ReturnType {
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
			return {
				ignore: true,
				path: dependencyName,
			}
		}
		return {
			path: result,
		}
	}
}
