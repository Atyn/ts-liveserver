import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class CodeOptimizerTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const withoutUseStrict = this.reduceUseStrict(sourceFile)
		const wihoutEmptyFunctions = this.reduceEmptyFunctions(withoutUseStrict)
		const reducedBinaryExpressions = this.reduceBinaryExpressions(
			wihoutEmptyFunctions,
		)
		return this.reduceIfStatements(reducedBinaryExpressions)
	}
	public transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
	private reduceUseStrict(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] | undefined => {
			if (
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isStringLiteral(node.expression) &&
				node.expression.text === 'use strict'
			) {
				return undefined
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private reduceEmptyFunctions(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			if (
				TypeScript.isExpressionStatement(node) &&
				TypeScript.isCallExpression(node.expression) &&
				node.expression.arguments.length === 0 &&
				TypeScript.isParenthesizedExpression(node.expression.expression) &&
				TypeScript.isFunctionExpression(
					node.expression.expression.expression,
				) &&
				node.expression.expression.expression.parameters.length === 0 &&
				TypeScript.isBlock(node.expression.expression.expression.body) &&
				node.expression.expression.expression.body.statements &&
				node.expression.expression.expression.body.statements.length
			) {
				return [
					...TypeScript.visitNodes(
						node.expression.expression.expression.body.statements,
						visit,
					),
				]
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private reduceBinaryExpressions(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			const analyzedNode = TypeScript.visitEachChild(node, visit, this.context)
			if (
				TypeScript.isBinaryExpression(analyzedNode) &&
				this.isExpressionStaticallyTruthy(analyzedNode)
			) {
				return TypeScript.factory.createTrue()
			}
			if (
				TypeScript.isBinaryExpression(analyzedNode) &&
				this.isExpressionStaticallyFalsy(analyzedNode)
			) {
				return TypeScript.factory.createFalse()
			}
			return analyzedNode
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private reduceIfStatements(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] | undefined => {
			if (TypeScript.isIfStatement(node)) {
				// Only if
				if (
					node.expression.kind === TypeScript.SyntaxKind.TrueKeyword &&
					TypeScript.isBlock(node.thenStatement)
				) {
					return [
						...TypeScript.visitNodes(node.thenStatement.statements, visit),
					]
				}
				// Only else
				if (node.expression.kind === TypeScript.SyntaxKind.FalseKeyword) {
					if (node.elseStatement && TypeScript.isBlock(node.elseStatement)) {
						// return node.elseStatement.statements
						return [
							...TypeScript.visitNodes(node.elseStatement.statements, visit),
						]
					} else {
						return undefined
					}
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	private isExpressionStaticallyTruthy(node: TypeScript.Expression): boolean {
		// The same
		if (
			TypeScript.isBinaryExpression(node) &&
			(node.operatorToken.kind === TypeScript.SyntaxKind.EqualsEqualsToken ||
				node.operatorToken.kind ===
					TypeScript.SyntaxKind.EqualsEqualsEqualsToken)
		) {
			if (
				TypeScript.isStringLiteral(node.left) &&
				TypeScript.isStringLiteral(node.right) &&
				node.left.text == node.right.text
			) {
				return true
			}
		}
		// NOT the same
		if (
			TypeScript.isBinaryExpression(node) &&
			(node.operatorToken.kind ===
				TypeScript.SyntaxKind.ExclamationEqualsEqualsToken ||
				node.operatorToken.kind ===
					TypeScript.SyntaxKind.ExclamationEqualsToken)
		) {
			if (
				TypeScript.isStringLiteral(node.left) &&
				TypeScript.isStringLiteral(node.right) &&
				node.left.text != node.right.text
			) {
				return true
			}
		}
		return false
	}
	private isExpressionStaticallyFalsy(node: TypeScript.Expression): boolean {
		if (
			TypeScript.isBinaryExpression(node) &&
			(node.operatorToken.kind === TypeScript.SyntaxKind.EqualsEqualsToken ||
				node.operatorToken.kind ===
					TypeScript.SyntaxKind.EqualsEqualsEqualsToken)
		) {
			if (
				TypeScript.isStringLiteral(node.left) &&
				TypeScript.isStringLiteral(node.right) &&
				node.left.text !== node.right.text
			) {
				return true
			}
		}
		if (
			TypeScript.isBinaryExpression(node) &&
			(node.operatorToken.kind ===
				TypeScript.SyntaxKind.ExclamationEqualsEqualsToken ||
				node.operatorToken.kind ===
					TypeScript.SyntaxKind.ExclamationEqualsToken)
		) {
			if (
				TypeScript.isStringLiteral(node.left) &&
				TypeScript.isStringLiteral(node.right) &&
				node.left.text == node.right.text
			) {
				return true
			}
		}
		return false
	}
}
