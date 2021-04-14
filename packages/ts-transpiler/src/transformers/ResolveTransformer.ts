import TypeScript from 'typescript'
import IEsmDependencyResolver from '../types/IEsmDependencyResolver'

export default class ResolveTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private resolver: IEsmDependencyResolver
	constructor(
		context: TypeScript.TransformationContext,
		resolver: IEsmDependencyResolver,
	) {
		this.context = context
		this.resolver = resolver
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
				TypeScript.isImportDeclaration(node) &&
				TypeScript.isStringLiteral(node.moduleSpecifier)
			) {
				const resolvedName = this.getDependencyName(
					sourceFile.fileName,
					node.moduleSpecifier.text,
				)
				return TypeScript.factory.updateImportDeclaration(
					node,
					node.decorators,
					node.modifiers,
					node.importClause,
					TypeScript.factory.createStringLiteral(resolvedName),
				)
			}
			if (
				TypeScript.isExportDeclaration(node) &&
				node.moduleSpecifier &&
				TypeScript.isStringLiteral(node.moduleSpecifier)
			) {
				const resolvedName = this.getDependencyName(
					sourceFile.fileName,
					node.moduleSpecifier.text,
				)
				return TypeScript.factory.updateExportDeclaration(
					node,
					node.decorators,
					node.modifiers,
					node.isTypeOnly,
					node.exportClause,
					TypeScript.factory.createStringLiteral(resolvedName),
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
					this.getDependencyName(sourceFile.fileName, node.text),
				)
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private getDependencyName(
		parentFilePath: string,
		dependencyName: string,
	): string {
		return this.resolver.resolveDependencyName(parentFilePath, dependencyName)
	}
}
