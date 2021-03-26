import TypeScript from 'typescript'

const KEYNAME_EXPORTS = 'exports'
/*
Transpile CommonJS to ES6 module
*/
export default class CommonJsTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private exportsVariableMap: Record<string, string> = {}
	private counter = 0
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (this.isCommonJsModule(sourceFile) === false) {
			return sourceFile
		}
		const withoutModule = this.stripModule(sourceFile)
		const withoutDefineProperty = this.convertDefinePropery(withoutModule)
		const withoutWildcardExports = this.stripWildcardExports(
			withoutDefineProperty,
		)
		const requireInTopScope = this.requireTopScope(withoutWildcardExports)
		const esmExport = this.convertToEsmExport(requireInTopScope)
		const withEsmImport = this.convertToEsmImport(esmExport)
		const withSyntheticDefaultExport = this.createSyntheticDefaultExport(
			withEsmImport,
		)
		return this.addModuleToScope(withSyntheticDefaultExport)
	}
	public transformBundle(): TypeScript.Bundle {
		throw new Error('Method not implemented.')
	}
	private isCommonJsModule(sourceFile: TypeScript.SourceFile): boolean {
		return /require|exports/gm.test(sourceFile.text)
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
						const propertyValue = thirdArgument.properties
							.filter((property) => TypeScript.isPropertyAssignment(property))
							.find(
								(property) =>
									TypeScript.isPropertyAssignment(property) &&
									TypeScript.isIdentifier(property.name) &&
									property.name.text === 'value',
							)
						if (
							propertyValue &&
							TypeScript.isPropertyAssignment(propertyValue) &&
							propertyValue.initializer
						) {
							return TypeScript.factory.createBinaryExpression(
								TypeScript.factory.createPropertyAccessExpression(
									TypeScript.factory.createIdentifier(KEYNAME_EXPORTS),
									TypeScript.factory.createIdentifier(secondArgument.text),
								),
								TypeScript.SyntaxKind.EqualsToken,
								propertyValue.initializer,
							)
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
										variableDeclaration.name,
										undefined,
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
			// exports.something = something;
			if (
				TypeScript.isPropertyAccessExpression(node) &&
				TypeScript.isIdentifier(node.name) &&
				TypeScript.isIdentifier(node.expression) &&
				node.expression.text === KEYNAME_EXPORTS
			) {
				if (node.name.text in this.exportsVariableMap) {
					return TypeScript.factory.createIdentifier(
						this.exportsVariableMap[node.name.text],
					)
				} else {
					const newIdentifierName = this.generateUniqueName()
					this.exportsVariableMap[node.name.text] = newIdentifierName
					const identifier = TypeScript.factory.createIdentifier(
						newIdentifierName,
					)
					newTopStatements.push(
						TypeScript.factory.createVariableStatement(
							undefined,
							TypeScript.factory.createVariableDeclarationList(
								[
									TypeScript.factory.createVariableDeclaration(
										newIdentifierName,
										undefined,
										undefined,
										undefined,
									),
								],
								TypeScript.NodeFlags.Let,
							),
						),
					)
					// exports.default = something;
					if (node.name.text === 'default') {
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
										node.name,
									),
								]),
							),
						)
					}
					return identifier
				}
				/*
				return TypeScript.factory.createExpressionStatement(
					TypeScript.factory.createBinaryExpression(
						identifier,
						node.expression.operatorToken,
						node.expression.right,
					),
				)
				*/
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
							(TypeScript.isPropertyAssignment(property) ||
								TypeScript.isShorthandPropertyAssignment(property)) &&
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
										TypeScript.isShorthandPropertyAssignment(property)
											? property.name
											: property.initializer,
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
					TypeScript.factory.createVariableStatement(
						undefined,
						TypeScript.factory.createVariableDeclarationList(
							[
								TypeScript.factory.createVariableDeclaration(
									newIdentifierName,
									undefined,
									undefined,
									node,
								),
							],
							TypeScript.NodeFlags.Let,
						),
					),
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
	// export { hello as Hello } -> export default { something: hello }
	private createSyntheticDefaultExport(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const exportSpecifiers: TypeScript.ExportSpecifier[] = []
		const visit = (node: TypeScript.Node): TypeScript.Node | undefined => {
			if (
				TypeScript.isExportDeclaration(node) &&
				node.exportClause &&
				TypeScript.isNamedExports(node.exportClause)
			) {
				exportSpecifiers.push(...node.exportClause.elements)
				return undefined
			}
			return node
		}
		const changedSourceFile = TypeScript.visitEachChild(
			sourceFile,
			visit,
			this.context,
		)
		if (exportSpecifiers.length === 0) {
			return sourceFile
		}
		const propertyAssignments: TypeScript.PropertyAssignment[] = []
		for (const exportSpecifier of exportSpecifiers) {
			if (
				exportSpecifier.propertyName &&
				TypeScript.isIdentifier(exportSpecifier.propertyName)
			) {
				propertyAssignments.push(
					TypeScript.factory.createPropertyAssignment(
						exportSpecifier.name,
						exportSpecifier.propertyName,
					),
				)
			}
		}
		const newStatements = [
			...changedSourceFile.statements,
			TypeScript.factory.createExportDeclaration(
				undefined,
				undefined,
				false,
				TypeScript.factory.createNamedExports(exportSpecifiers),
			),
		]
		// If there is not export default already -> add synthentic
		if (
			sourceFile.statements.every(
				(node) => !TypeScript.isExportAssignment(node),
			)
		) {
			newStatements.push(
				TypeScript.factory.createExportAssignment(
					undefined,
					undefined,
					undefined,
					TypeScript.factory.createObjectLiteralExpression(propertyAssignments),
				),
			)
		}
		return TypeScript.factory.updateSourceFile(changedSourceFile, [
			...newStatements,
		])
	}
	// Add const exports = {}, module = { exports: exports };
	private addModuleToScope(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		return TypeScript.factory.updateSourceFile(sourceFile, [
			TypeScript.factory.createVariableStatement(
				undefined,
				TypeScript.factory.createVariableDeclarationList(
					[
						TypeScript.factory.createVariableDeclaration(
							'exports',
							undefined,
							undefined,
							TypeScript.factory.createObjectLiteralExpression(),
						),
						TypeScript.factory.createVariableDeclaration(
							'module',
							undefined,
							undefined,
							TypeScript.factory.createObjectLiteralExpression([
								TypeScript.factory.createPropertyAssignment(
									'exports',
									TypeScript.factory.createIdentifier('exports'),
								),
							]),
						),
					],
					TypeScript.NodeFlags.Const,
				),
			),
			...sourceFile.statements,
		])
	}
}
