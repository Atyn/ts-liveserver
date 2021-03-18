import TypeScript, { TypeChecker } from 'typescript'

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
	transformBundle(): TypeScript.Bundle {
		throw new Error('Method not implemented.')
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const requireInTopScope = this.requireTopScope(sourceFile)
		const withoutModule = this.stripModule(requireInTopScope)
		const withoutDefineProperty = this.convertDefinePropery(withoutModule)
		const esmExport = this.convertToEsmExport(withoutDefineProperty)
		return this.convertToEsmImport(esmExport)
	}
	// Generate a file unique variable name
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
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isCallExpression(node.expression) &&
				TypeScript.isPropertyAccessExpression(node.expression.expression) &&
				TypeScript.isIdentifier(node.expression.expression.expression) &&
				TypeScript.isIdentifier(node.expression.expression.name) &&
				node.expression.expression.expression.getText() === 'Object' &&
				node.expression.expression.name.getText() === 'defineProperty' &&
				TypeScript.isIdentifier(node.expression.arguments[0]) &&
				node.expression.arguments[0].getText() === 'exports'
			) {
				const secondArgument = node.expression.arguments[1]
				const thirdArgument = node.expression.arguments[2]
				if (
					TypeScript.isStringLiteral(secondArgument) &&
					TypeScript.isIdentifier(thirdArgument)
				) {
					return TypeScript.factory.createExportDeclaration(
						undefined,
						undefined,
						false,
						TypeScript.factory.createNamedExports([
							TypeScript.factory.createExportSpecifier(
								thirdArgument,
								secondArgument.text,
							),
						]),
					)
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitNode(sourceFile, visit)
	}
	// Top level CommonJS to ESM
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
						variableDeclaration.initializer.expression.getText() ===
							'require' &&
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
	// Top level CommonJS to ESM
	private convertToEsmExport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
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
					node.expression.left.expression.getText() === 'exports'
				) {
					// exports.default = something;
					if (node.expression.left.name.getText() === 'default') {
						return TypeScript.factory.createExportAssignment(
							undefined,
							undefined,
							undefined,
							node.expression.right,
						)
					}
					// exports.something = anIdentifier;
					else if (TypeScript.isIdentifier(node.expression.right)) {
						return TypeScript.factory.createExportDeclaration(
							undefined,
							undefined,
							false,
							TypeScript.factory.createNamedExports([
								TypeScript.factory.createExportSpecifier(
									node.expression.right,
									node.expression.left.name,
								),
							]),
						)
					} else {
						const newIdentifierName = this.generateUniqueName()
						const variableStatement = TypeScript.factory.createVariableStatement(
							undefined,
							[
								TypeScript.factory.createVariableDeclaration(
									newIdentifierName,
									undefined,
									undefined,
									node.expression.right,
								),
							],
						)
						return [
							variableStatement,
							TypeScript.factory.createExportDeclaration(
								undefined,
								undefined,
								false,
								TypeScript.factory.createNamedExports([
									TypeScript.factory.createExportSpecifier(
										TypeScript.factory.createIdentifier(newIdentifierName),
										node.expression.left.name,
									),
								]),
							),
						]
					}
				}
				// exports = something;
				if (
					TypeScript.isIdentifier(node.expression.left) &&
					node.expression.left.getText() === 'exports'
				) {
					// exports = { a: false, b: true }
					if (TypeScript.isObjectLiteralExpression(node.expression.right)) {
						const exportSpecifiers: TypeScript.ExportSpecifier[] = []
						for (const property of node.expression.right.properties) {
							if (
								TypeScript.isPropertyAssignment(property) &&
								TypeScript.isIdentifier(property.name) &&
								TypeScript.isIdentifier(property.initializer)
							) {
								exportSpecifiers.push(
									TypeScript.factory.createExportSpecifier(
										property.initializer,
										property.name,
									),
								)
							}
						}
						return TypeScript.factory.createExportDeclaration(
							undefined,
							undefined,
							false,
							TypeScript.factory.createNamedExports(exportSpecifiers),
						)
					}
					// exports = require('hello.js');
					else if (
						TypeScript.isCallExpression(node.expression.right) &&
						node.expression.right.expression.getText() === 'require' &&
						TypeScript.isStringLiteral(node.expression.right.arguments[0])
					) {
						return TypeScript.factory.createExportDeclaration(
							undefined,
							undefined,
							false,
							undefined,
							node.expression.right.arguments[0],
						)
					}
					// exports = 'hello' or exports = Hello
					else {
						return TypeScript.factory.createExportAssignment(
							undefined,
							undefined,
							undefined,
							node.expression.right,
						)
					}
				}
			}
			return node
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
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
				node.expression.getText() === 'module' &&
				node.name.getText() === 'exports'
			) {
				return node.name
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
				node.expression.getText() === 'require' &&
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
