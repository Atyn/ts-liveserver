import TypeScript from 'typescript'
import DependencyResolver from './utils/DependencyResolver'

export default class ResolveTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const dynamicImportsResolved = this.resolveDynamicImport(sourceFile)
		return this.resolveStaticImport(dynamicImportsResolved)
	}
	public transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
	private resolveStaticImport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				(TypeScript.isImportDeclaration(node) ||
					TypeScript.isExportDeclaration(node)) &&
				node.moduleSpecifier
			) {
				return TypeScript.visitEachChild(node, visit, this.context)
			}
			if (
				TypeScript.isStringLiteral(node) &&
				node.parent &&
				(TypeScript.isExportDeclaration(node.parent) ||
					TypeScript.isImportDeclaration(node.parent)) &&
				node.parent.moduleSpecifier
			) {
				return TypeScript.factory.createStringLiteral(
					new DependencyResolver(
						node.getSourceFile().fileName,
						this.context,
					).resolveRelativeDependency(node.text),
					//	this.resolveDependencyName(node.getSourceFile().fileName, node.text),
				)
			}
			return node
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private resolveDynamicImport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				node.parent &&
				TypeScript.isCallExpression(node.parent) &&
				node.parent.expression.kind === TypeScript.SyntaxKind.ImportKeyword &&
				TypeScript.isStringLiteral(node) &&
				node === node.parent.arguments[0]
			) {
				return TypeScript.factory.createStringLiteral(
					new DependencyResolver(
						node.getSourceFile().fileName,
						this.context,
					).resolveRelativeDependency(node.text),
				)
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
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
				new DependencyResolver(
					node.getSourceFile().fileName,
					this.context,
				).resolveRelativeDependency(node.text),
				//	this.resolveDependencyName(node.getSourceFile().fileName, node.text),
			)
		}
		return node
	}
}
