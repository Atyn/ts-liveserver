import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class EnsureExportDefaultTransformer
	implements TypeScript.CustomTransformer
{
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (this.hasDefaultExport(sourceFile)) {
			return sourceFile
		}
		return TypeScript.factory.updateSourceFile(sourceFile, [
			...sourceFile.statements,
			TypeScript.factory.createExportAssignment(
				undefined,
				undefined,
				undefined,
				TypeScript.factory.createNull(),
			),
		])
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
	private hasDefaultExport(sourceFile: TypeScript.SourceFile): boolean {
		for (const statement of sourceFile.statements) {
			if (TypeScript.isExportAssignment(statement)) {
				return true
			} else if (
				TypeScript.isExportDeclaration(statement) &&
				statement.exportClause &&
				TypeScript.isNamedExports(statement.exportClause) &&
				statement.exportClause.elements &&
				statement.exportClause.elements.length &&
				statement.exportClause.elements.some(
					(element) => element.name.text === 'default',
				)
			) {
				return true
			} else if (
				statement.modifiers &&
				statement.modifiers.some(
					(node) => node.kind === TypeScript.SyntaxKind.ExportKeyword,
				) &&
				statement.modifiers.some(
					(node) => node.kind === TypeScript.SyntaxKind.DefaultKeyword,
				)
			) {
				return true
			}
		}
		return false
	}
}
