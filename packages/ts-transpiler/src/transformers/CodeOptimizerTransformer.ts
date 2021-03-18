import TypeScript from 'typescript'
import BinaryExpressionsReducer from './utils/BinaryExpressionsReducer'
import IfStatementReducer from './utils/IfStatementReducer'

/*
Replaces process.env.NODE_ENV in code
*/
export default class CodeOptimizerTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private moduleResolutionHost: TypeScript.ModuleResolutionHost
	private binaryExpressionsReducer: BinaryExpressionsReducer
	private ifStatementReducer: IfStatementReducer
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
		this.binaryExpressionsReducer = new BinaryExpressionsReducer(context)
		this.ifStatementReducer = new IfStatementReducer(context)
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		)
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		return this.ifStatementReducer.transformSourceFile(
			this.binaryExpressionsReducer.transformSourceFile(node),
		)
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
