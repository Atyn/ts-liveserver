import TypeScript from 'typescript'

/*
Transpile CommonJS to ES6 module
*/
export default class CommonJsTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	private visit(node: TypeScript.Node) {
		// Import
		if (
			TypeScript.isExpressionStatement(node) &&
			TypeScript.isCallExpression(node.expression) &&
			TypeScript.isIdentifier(node.expression.expression) &&
			node.expression.expression.getText() === 'require' &&
			node.expression.arguments.length === 1
		) {
			const argument = node.expression.arguments[0]
			if (TypeScript.isStringLiteralLike(argument)) {
				return TypeScript.factory.createImportDeclaration(
					undefined,
					undefined,
					undefined,
					TypeScript.factory.createStringLiteral(argument.text),
				)
			}
		}
		// Default import
		if (
			TypeScript.isVariableStatement(node) &&
			TypeScript.isVariableDeclarationList(node.declarationList) &&
			node.declarationList.declarations.length === 1 &&
			TypeScript.isVariableDeclaration(node.declarationList.declarations[0])
		) {
			const declaration = node.declarationList.declarations[0]
			if (
				TypeScript.isVariableDeclaration(declaration) &&
				declaration.initializer &&
				TypeScript.isCallExpression(declaration.initializer) &&
				TypeScript.isIdentifier(declaration.initializer.expression) &&
				declaration.initializer.expression.getText() === 'require' &&
				declaration.initializer.arguments.length === 1
			) {
				const argument = declaration.initializer.arguments[0]
				if (TypeScript.isStringLiteralLike(argument)) {
					if (TypeScript.isIdentifier(declaration.name)) {
						return TypeScript.factory.createImportDeclaration(
							undefined,
							undefined,
							TypeScript.factory.createImportClause(
								false,
								declaration.name,
								undefined,
							),
							TypeScript.factory.createStringLiteral(argument.text),
						)
					} else if (TypeScript.isObjectBindingPattern(declaration.name)) {
						return TypeScript.factory.createImportDeclaration(
							undefined,
							undefined,
							TypeScript.factory.createImportClause(
								false,
								undefined,
								TypeScript.factory.createNamedImports(
									declaration.name.elements.map((bindingElement) =>
										TypeScript.factory.createImportSpecifier(
											bindingElement.propertyName as TypeScript.Identifier,
											bindingElement.name as TypeScript.Identifier,
										),
									),
								),
							),
							TypeScript.factory.createStringLiteral(argument.text),
						)
					}
				}
			}
		}
		// Default export
		if (
			TypeScript.isExpressionStatement(node) &&
			TypeScript.isBinaryExpression(node.expression) &&
			TypeScript.isPropertyAccessExpression(node.expression.left) &&
			TypeScript.isIdentifier(node.expression.left.expression) &&
			TypeScript.isIdentifier(node.expression.left.name) &&
			node.expression.left.name.getText() === 'exports' &&
			node.expression.left.expression.getText() === 'module'
		) {
			return TypeScript.factory.createExportAssignment(
				undefined,
				undefined,
				undefined,
				node.expression.right,
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
