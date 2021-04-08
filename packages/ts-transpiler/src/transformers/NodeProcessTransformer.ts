import TypeScript from 'typescript'

const PROCESS: Record<string, string> = {
	arch: 'x64',
}

/*
Replaces process.env.NODE_ENV in code
*/
export default class NodeProcessTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	private visit(node: TypeScript.Node) {
		if (
			TypeScript.isPropertyAccessExpression(node) &&
			TypeScript.isIdentifier(node.name) &&
			TypeScript.isIdentifier(node.expression) &&
			node.expression.getText() === 'process'
		) {
			const key = node.name.getText()
			if (key in PROCESS) {
				return TypeScript.factory.createStringLiteral(PROCESS[key])
			}
		}
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
	}
	transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (!/process\./gm.test(sourceFile.text)) {
			return sourceFile
		}
		return TypeScript.visitNode(sourceFile, this.visit.bind(this))
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
