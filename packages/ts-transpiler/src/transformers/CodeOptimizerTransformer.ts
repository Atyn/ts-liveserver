import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class CodeOptimizerTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private moduleResolutionHost: TypeScript.ModuleResolutionHost
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		)
	}
	private isExpressionStaticallyTruthy(node: TypeScript.Expression): boolean {
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
		return false
	}
	private visit(node: TypeScript.Node) {
		if (
			TypeScript.isIfStatement(node) &&
			this.isExpressionStaticallyTruthy(node.expression)
		) {
			if (TypeScript.isBlock(node.thenStatement)) {
				return node.thenStatement.statements
			}
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
