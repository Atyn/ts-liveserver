import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class IfStatementReducer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	private visit(node: TypeScript.Node) {
		if (TypeScript.isIfStatement(node)) {
			// Only if
			if (
				node.expression.kind === TypeScript.SyntaxKind.TrueKeyword &&
				TypeScript.isBlock(node.thenStatement)
			) {
				return TypeScript.visitNodes(
					node.thenStatement.statements,
					this.visit.bind(this),
				)
			}
			// Only else
			if (node.expression.kind === TypeScript.SyntaxKind.FalseKeyword) {
				if (node.elseStatement && TypeScript.isBlock(node.elseStatement)) {
					// return node.elseStatement.statements
					return TypeScript.visitNodes(
						node.elseStatement.statements,
						this.visit.bind(this),
					)
				} else {
					return undefined
				}
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
