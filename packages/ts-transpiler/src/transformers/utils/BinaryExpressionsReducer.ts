import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class BinaryExpressionsReducer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
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
	private visit(node: TypeScript.Node) {
		if (
			TypeScript.isBinaryExpression(node) &&
			this.isExpressionStaticallyTruthy(node)
		) {
			return TypeScript.factory.createTrue()
		}
		if (
			TypeScript.isBinaryExpression(node) &&
			this.isExpressionStaticallyFalsy(node)
		) {
			return TypeScript.factory.createFalse()
		}
		if (
			TypeScript.isExpressionStatement(node) &&
			TypeScript.isCallExpression(node.expression) &&
			node.expression.arguments.length === 0 &&
			TypeScript.isParenthesizedExpression(node.expression.expression) &&
			TypeScript.isFunctionExpression(node.expression.expression.expression) &&
			node.expression.expression.expression.parameters.length === 0 &&
			TypeScript.isBlock(node.expression.expression.expression.body)
		) {
			return TypeScript.visitNodes(
				node.expression.expression.expression.body.statements,
				this.visit.bind(this),
			)
			// return node.expression.expression.expression.body.statements
		}
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		return TypeScript.visitNode(node, this.visit.bind(this))
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
