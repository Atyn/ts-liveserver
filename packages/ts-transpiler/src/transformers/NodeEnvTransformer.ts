import TypeScript from 'typescript'

/*
Replaces process.env.NODE_ENV in code
*/
export default class NodeEnvTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private moduleResolutionHost: TypeScript.ModuleResolutionHost
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		)
	}
	private visit(node: TypeScript.Node) {
		if (
			TypeScript.isPropertyAccessExpression(node) &&
			TypeScript.isPropertyAccessExpression(node.expression) &&
			TypeScript.isIdentifier(node.name) &&
			TypeScript.isIdentifier(node.expression.expression) &&
			TypeScript.isIdentifier(node.expression.name) &&
			node.name.getText() === 'NODE_ENV' &&
			node.expression.name.getText() === 'env' &&
			node.expression.expression.getText() === 'process'
		) {
			if (process.env.NODE_ENV) {
				return TypeScript.factory.createStringLiteral(process.env.NODE_ENV)
			} else {
				return TypeScript.factory.createStringLiteral('production')
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
