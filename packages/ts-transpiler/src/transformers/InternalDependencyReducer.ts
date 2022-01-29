import TypeScript from 'typescript'

const INTERNAL_PACKAGES = ['path', 'util']

/*
Removed require('path')
*/
export default class InternalDependencyReducer
	implements TypeScript.CustomTransformer
{
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const visit = (
			node: TypeScript.Node,
		): TypeScript.Node | TypeScript.Node[] => {
			if (
				TypeScript.isTryStatement(node) &&
				node.tryBlock &&
				this.shouldCrash(node.tryBlock)
			) {
				if (
					node?.catchClause?.block &&
					TypeScript.isBlock(node.catchClause.block) &&
					node.catchClause.block.statements.length
				) {
					return [...node.catchClause.block.statements]
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
	private shouldCrash(block: TypeScript.Block): boolean {
		let crashing = false
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isCallExpression(node) &&
				node.expression &&
				TypeScript.isIdentifier(node.expression) &&
				node.expression.text === 'require' &&
				node.arguments
			) {
				const argument = node.arguments[0]
				if (
					TypeScript.isStringLiteral(argument) &&
					argument &&
					INTERNAL_PACKAGES.includes(argument.text)
				) {
					crashing = true
					return node
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		TypeScript.visitEachChild(block, visit, this.context)
		return crashing
	}
}
