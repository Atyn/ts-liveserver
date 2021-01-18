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
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		return TypeScript.visitNode(node, this.visit.bind(this))
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
