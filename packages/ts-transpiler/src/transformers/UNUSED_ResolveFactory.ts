import TypeScript from 'typescript'
import Path from 'path'

const ResolveFactory: TypeScript.TransformerFactory<TypeScript.SourceFile> = (
	context: TypeScript.TransformationContext,
): TypeScript.Transformer<TypeScript.SourceFile> => {
	const visit: TypeScript.Visitor = (node: TypeScript.Node) => {
		if (
			TypeScript.isStringLiteral(node) &&
			TypeScript.isImportDeclaration(node.parent)
		) {
			const filePath = node.getSourceFile().fileName
			const dependencyFilePath = require.resolve(node.text, {
				paths: [Path.dirname(filePath)],
			})
			const relativeDir =
				Path.relative(
					Path.dirname(filePath),
					Path.dirname(dependencyFilePath),
				) || '.'
			const relativeDependencyFilePath =
				relativeDir + '/' + Path.basename(dependencyFilePath)
			return TypeScript.factory.createStringLiteral(relativeDependencyFilePath)
		}
		return TypeScript.visitEachChild(node, (child) => visit(child), context)
	}
	return (node: TypeScript.SourceFile) => TypeScript.visitNode(node, visit)
}

export default ResolveFactory
