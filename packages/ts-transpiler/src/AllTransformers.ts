import TypeScript from 'typescript'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'
import NodeEnvTransformer from './transformers/NodeEnvTransformer'
import CodeOptimizerTransformer from './transformers/CodeOptimizerTransformer'

export default {
	before: [
		(context) => new NodeEnvTransformer(context),
		(context) => new CodeOptimizerTransformer(context),
		(context) => new CommonJsTransformer(context),
		(context) => new ResolveTransformer(context),
	],
	after: [],
} as TypeScript.CustomTransformers