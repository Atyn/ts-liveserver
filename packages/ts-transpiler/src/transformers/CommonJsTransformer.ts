import TypeScript from 'typescript'

const KEYNAME_EXPORTS = 'exports'
/*
Transpile CommonJS to ES6 module
*/
export default class CommonJsTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private counter = 0
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	public transformBundle(): TypeScript.Bundle {
		throw new Error('Method not implemented.')
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const withoutModule = this.stripModule(sourceFile)
		const withoutDefineProperty = this.convertDefinePropery(withoutModule)
		const withoutWildcardExports = this.stripWildcardExports(
			withoutDefineProperty,
		)
		const requireInTopScope = this.requireTopScope(withoutWildcardExports)
		// const exportsTopScope = this.exportsTopScope(requireInTopScope)
		const esmExport = this.convertToEsmExport(requireInTopScope)
		return this.convertToEsmImport(esmExport)
	}
	// Generate a file-unique variable name
	private generateUniqueName() {
		this.counter++
		return 'GENERATED_VAR_BY_TRANSFORMER_' + String(this.counter)
	}
	// Convert all Object.defineProperty(exports, "hello", Hello);"
	private convertDefinePropery(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isCallExpression(node) &&
				TypeScript.isPropertyAccessExpression(node.expression) &&
				TypeScript.isIdentifier(node.expression.expression) &&
				TypeScript.isIdentifier(node.expression.name) &&
				node.expression.expression.text === 'Object' &&
				node.expression.name.text === 'defineProperty' &&
				TypeScript.isIdentifier(node.arguments[0])
			) {
				const firstArgument = node.arguments[0]
				const secondArgument = node.arguments[1]
				const thirdArgument = node.arguments[2]
				if (
					TypeScript.isIdentifier(firstArgument) &&
					firstArgument.text === KEYNAME_EXPORTS &&
					TypeScript.isStringLiteral(secondArgument)
				) {
					if (TypeScript.isIdentifier(thirdArgument)) {
						return TypeScript.factory.createBinaryExpression(
							TypeScript.factory.createPropertyAccessExpression(
								TypeScript.factory.createIdentifier(KEYNAME_EXPORTS),
								TypeScript.factory.createIdentifier(secondArgument.text),
							),
							TypeScript.SyntaxKind.EqualsToken,
							thirdArgument,
						)
					} else if (TypeScript.isObjectLiteralExpression(thirdArgument)) {
						const propertyGetter = thirdArgument.properties
							.filter((property) => TypeScript.isPropertyAssignment(property))
							.find(
								(property) =>
									TypeScript.isPropertyAssignment(property) &&
									TypeScript.isIdentifier(property.name) &&
									property.name.text === 'get',
							)
						if (
							propertyGetter &&
							TypeScript.isPropertyAssignment(propertyGetter) &&
							propertyGetter.initializer &&
							TypeScript.isFunctionExpression(propertyGetter.initializer) &&
							TypeScript.isBlock(propertyGetter.initializer.body)
						) {
							const firstStatement =
								propertyGetter.initializer.body.statements[0]
							if (
								TypeScript.isReturnStatement(firstStatement) &&
								firstStatement.expression
							) {
								return TypeScript.factory.createBinaryExpression(
									TypeScript.factory.createPropertyAccessExpression(
										TypeScript.factory.createIdentifier(KEYNAME_EXPORTS),
										TypeScript.factory.createIdentifier(secondArgument.text),
									),
									TypeScript.SyntaxKind.EqualsToken,
									firstStatement.expression,
								)
							}
						}
					}
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitNode(sourceFile, visit)
	}
	// Top level CommonJS to ESM. const hello = require('hello')
	private convertToEsmImport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			// Import without name
			if (
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isCallExpression(node.expression) &&
				TypeScript.isIdentifier(node.expression.expression) &&
				node.expression.expression.text === 'require' &&
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
			// Import with reference
			if (
				TypeScript.isVariableStatement(node) &&
				TypeScript.isVariableDeclarationList(node.declarationList)
			) {
				const importDeclarations: TypeScript.ImportDeclaration[] = []
				const variableDeclarations: TypeScript.VariableDeclaration[] = []
				for (const variableDeclaration of node.declarationList.declarations) {
					if (
						variableDeclaration.initializer &&
						TypeScript.isCallExpression(variableDeclaration.initializer) &&
						TypeScript.isIdentifier(
							variableDeclaration.initializer.expression,
						) &&
						variableDeclaration.initializer.expression.text === 'require' &&
						variableDeclaration.initializer.arguments.length === 1
					) {
						const argument = variableDeclaration.initializer.arguments[0]
						if (
							TypeScript.isStringLiteral(argument) &&
							TypeScript.isIdentifier(variableDeclaration.name)
						) {
							importDeclarations.push(
								TypeScript.factory.createImportDeclaration(
									undefined,
									undefined,
									TypeScript.factory.createImportClause(
										false,
										undefined,
										TypeScript.factory.createNamespaceImport(
											variableDeclaration.name,
										),
									),
									argument,
								),
							)
						} else if (
							TypeScript.isStringLiteral(argument) &&
							TypeScript.isObjectBindingPattern(variableDeclaration.name)
						) {
							importDeclarations.push(
								TypeScript.factory.createImportDeclaration(
									undefined,
									undefined,
									TypeScript.factory.createImportClause(
										false,
										undefined,
										TypeScript.factory.createNamedImports(
											variableDeclaration.name.elements.map((bindingElement) =>
												TypeScript.factory.createImportSpecifier(
													bindingElement.propertyName as TypeScript.Identifier,
													bindingElement.name as TypeScript.Identifier,
												),
											),
										),
									),
									TypeScript.factory.createStringLiteral(argument.text),
								),
							)
						}
					} else {
						variableDeclarations.push(variableDeclaration)
					}
				}
				if (variableDeclarations.length === 0) {
					return importDeclarations
				} else {
					return [
						...importDeclarations,
						TypeScript.factory.updateVariableStatement(
							node,
							undefined,
							TypeScript.factory.updateVariableDeclarationList(
								node.declarationList,
								variableDeclarations,
							),
						),
					]
				}
			}
			return node
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	// exports.hello = something -> export { something as hello }
	private convertToEsmExport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const newTopStatements: TypeScript.VariableStatement[] = []
		const newBottomStatements: (
			| TypeScript.ExportDeclaration
			| TypeScript.ExportAssignment
		)[] = []
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			if (
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isBinaryExpression(node.expression) &&
				node.expression.operatorToken.kind === TypeScript.SyntaxKind.EqualsToken
			) {
				// exports.something = something;
				if (
					TypeScript.isPropertyAccessExpression(node.expression.left) &&
					TypeScript.isIdentifier(node.expression.left.name) &&
					TypeScript.isIdentifier(node.expression.left.expression) &&
					node.expression.left.expression.text === KEYNAME_EXPORTS
				) {
					const newIdentifierName = this.generateUniqueName()
					const identifier = TypeScript.factory.createIdentifier(
						newIdentifierName,
					)
					newTopStatements.push(
						TypeScript.factory.createVariableStatement(undefined, [
							TypeScript.factory.createVariableDeclaration(
								newIdentifierName,
								undefined,
								undefined,
								undefined,
							),
						]),
					)
					// exports.default = something;
					if (node.expression.left.name.text === 'default') {
						newBottomStatements.push(
							TypeScript.factory.createExportAssignment(
								undefined,
								undefined,
								undefined,
								identifier,
							),
						)
					} else {
						newBottomStatements.push(
							TypeScript.factory.createExportDeclaration(
								undefined,
								undefined,
								false,
								TypeScript.factory.createNamedExports([
									TypeScript.factory.createExportSpecifier(
										newIdentifierName,
										node.expression.left.name,
									),
								]),
							),
						)
					}
					return TypeScript.factory.createExpressionStatement(
						TypeScript.factory.createBinaryExpression(
							identifier,
							node.expression.operatorToken,
							node.expression.right,
						),
					)
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		const changedSourceFile = TypeScript.visitNode(sourceFile, visit)
		return TypeScript.factory.updateSourceFile(changedSourceFile, [
			...newTopStatements,
			...changedSourceFile.statements,
			...newBottomStatements,
		])
	}
	// module.exports -> exports
	private stripModule(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isPropertyAccessExpression(node) &&
				TypeScript.isIdentifier(node.expression) &&
				TypeScript.isIdentifier(node.name) &&
				node.expression.text === 'module' &&
				node.name.text === KEYNAME_EXPORTS
			) {
				return TypeScript.factory.createIdentifier(node.name.text)
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitNode(sourceFile, visit)
	}
	// exports = hello -> export.default = hello
	// exports = { a: 'a' } -> exports.a = 'a';
	private stripWildcardExports(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			// exports = SOMETHING
			if (
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isBinaryExpression(node.expression) &&
				node.expression.operatorToken.kind ===
					TypeScript.SyntaxKind.EqualsToken &&
				TypeScript.isIdentifier(node.expression.left) &&
				node.expression.left.text === KEYNAME_EXPORTS
			) {
				// exports = { a: 'a' }
				if (TypeScript.isObjectLiteralExpression(node.expression.right)) {
					const expressions: TypeScript.ExpressionStatement[] = []
					for (const property of node.expression.right.properties) {
						if (
							TypeScript.isPropertyAssignment(property) &&
							TypeScript.isIdentifier(property.name)
						) {
							expressions.push(
								TypeScript.factory.createExpressionStatement(
									TypeScript.factory.createBinaryExpression(
										TypeScript.factory.createPropertyAccessExpression(
											TypeScript.factory.createIdentifier(KEYNAME_EXPORTS),
											TypeScript.factory.createIdentifier(property.name.text),
										),
										node.expression.operatorToken,
										property.initializer,
									),
								),
							)
						}
					}
					return expressions
				}
				// exports = Something
				else {
					return TypeScript.factory.createExpressionStatement(
						TypeScript.factory.createBinaryExpression(
							TypeScript.factory.createPropertyAccessExpression(
								TypeScript.factory.createIdentifier(KEYNAME_EXPORTS),
								TypeScript.factory.createIdentifier('default'),
							),
							node.expression.operatorToken,
							node.expression.right,
						),
					)
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitNode(sourceFile, visit)
	}
	// Move all require-calls to top-scope
	private requireTopScope(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const newStatements: TypeScript.VariableStatement[] = []
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			const inRootScope =
				node?.parent?.parent?.parent?.parent &&
				TypeScript.isVariableDeclaration(node.parent) &&
				TypeScript.isVariableDeclarationList(node.parent.parent) &&
				TypeScript.isVariableStatement(node.parent.parent.parent) &&
				TypeScript.isSourceFile(node.parent.parent.parent.parent)
			if (
				TypeScript.isCallExpression(node) &&
				TypeScript.isIdentifier(node.expression) &&
				node.arguments.length === 1 &&
				node.expression.text === 'require' &&
				inRootScope === false
			) {
				const newIdentifierName = this.generateUniqueName()
				newStatements.push(
					TypeScript.factory.createVariableStatement(undefined, [
						TypeScript.factory.createVariableDeclaration(
							newIdentifierName,
							undefined,
							undefined,
							node,
						),
					]),
				)
				return TypeScript.factory.createIdentifier(newIdentifierName)
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		const changedSourceFile = TypeScript.visitNode(sourceFile, visit)
		return TypeScript.factory.updateSourceFile(changedSourceFile, [
			...newStatements,
			...changedSourceFile.statements,
		])
	}
}
