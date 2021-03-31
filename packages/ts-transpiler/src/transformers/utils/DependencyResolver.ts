import TypeScript from 'typescript'
import Path from 'path'
import Fs from 'fs'
import Resolve from 'enhanced-resolve'

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json']

export default class DependencyResolver {
	private resolver = Resolve.create.sync({
		extensions: RESOLVE_EXTENSIONS,
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
		const result = relativeDir + '/' + pathObj.name + pathObj.ext
		if (result.startsWith('.')) {
			return result.replace(/\.(ts|tsx|jsx|json)$/, '.js')
		}
		return './' + result.replace(/\.(ts|tsx|jsx|json)$/, '.js')
	}
	// Return an aboslute path e.g. /tmp/a-apath/node_modules/hello/module.js
	private resolveDependencyPath(
		parentPath: string,
		dependencyName: string,
	): string {
		const withoutExtension = dependencyName.replace(
			Path.extname(dependencyName),
			'',
		)
		const result = this.resolver({}, Path.dirname(parentPath), withoutExtension)
		if (result === false) {
			throw new Error(
				'Could not resolve ' + dependencyName + ' from ' + parentPath,
			)
		}
		return result
	}
}
