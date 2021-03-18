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
	private visitModuleSpecifier(node: TypeScript.StringLiteral) {
		console.log(node.text)
		return TypeScript.factory.createStringLiteral(
			this.resolveDependencyName(node.getSourceFile().fileName, node.text),
		)
	}
	private visit(node: TypeScript.Node) {
		/*
		if (
			(TypeScript.isExportDeclaration(node) ||
				TypeScript.isImportDeclaration(node)) &&
			node.moduleSpecifier &&
			TypeScript.isStringLiteral(node.moduleSpecifier)
		) {
			return TypeScript.visitEachChild(
				node,
				this.visitModuleSpecifier.bind(this),
				this.context,
			)
		}
		*/
		/*
		if (
			node.getSourceFile()?.fileName ===
			'/home/anton/gitProjects/developeranton/ts-liveserver/node_modules/react-dom/cjs/react-dom.development.js'
		) {
			if ('moduleSpecifier' in node) {
				console.log('aaa')
			}
		}
		*/
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
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		console.log('--', node.getSourceFile().fileName)
		if (
			node.fileName ===
			'/home/anton/gitProjects/developeranton/ts-liveserver/node_modules/react-dom/cjs/react-dom.development.js'
		) {
			for (const n of node.statements) {
				if (TypeScript.isImportDeclaration(n)) {
					console.log('kind', n.moduleSpecifier)

					// console.log(n.moduleSpecifier.getText())
				}
			}
		}
		return TypeScript.visitNode(node, this.visit.bind(this))
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
