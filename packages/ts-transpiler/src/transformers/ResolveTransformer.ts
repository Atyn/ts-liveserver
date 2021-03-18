import TypeScript from 'typescript'
import Path from 'path'
/*
class ModuleResolutionHost implements TypeScript.ModuleResolutionHost {
	fileExists(fileName: string): boolean
	readFile(fileName: string): string | undefined
	trace?(s: string): void
	directoryExists?(directoryName: string): boolean
	realpath?(path: string): string
	getCurrentDirectory?(): string
	getDirectories?(path: string): string[]
}
*/

export default class ResolveTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private moduleResolutionHost: TypeScript.ModuleResolutionHost
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		)
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
		return relativeDir + '/' + pathObj.name + pathObj.ext
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
			this.moduleResolutionHost,
		)
		if (resolveResults?.resolvedModule?.isExternalLibraryImport) {
			const nodeResolve = require.resolve(dendencyName, {
				paths: [Path.dirname(parentPath)],
			})
			if (nodeResolve) {
				// disable-eslint no-console
				console.error(nodeResolve)
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
	private visit(node: TypeScript.Node) {
		if (
			(TypeScript.isImportDeclaration(node) ||
				TypeScript.isExportDeclaration(node)) &&
			node.moduleSpecifier
		) {
			return TypeScript.visitEachChild(
				node,
				this.visit.bind(this),
				this.context,
			)
		}
		if (
			TypeScript.isStringLiteral(node) &&
			node.parent &&
			(TypeScript.isExportDeclaration(node.parent) ||
				TypeScript.isImportDeclaration(node.parent)) &&
			node.parent.moduleSpecifier
		) {
			return TypeScript.factory.createStringLiteral(
				this.resolveDependencyName(node.getSourceFile().fileName, node.text),
			)
		}
		return node
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
