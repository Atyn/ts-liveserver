import Path from 'path'
import TypeScript from 'typescript'

export default (context: TypeScript.TransformationContext) => {
	const visit: TypeScript.Visitor = (node: TypeScript.Node) => {
		if (
			TypeScript.isStringLiteral(node) &&
			TypeScript.isImportDeclaration(node.parent)
		) {
			const filePath = node.getSourceFile().fileName
			// console.log('filePath:', filePath)
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
			console.log({
				srcFile: filePath,
				dependencyFilePath: dependencyFilePath,
				relative: relativeDependencyFilePath,
			})
			return TypeScript.factory.createStringLiteral(relativeDependencyFilePath)
		}
		return TypeScript.visitEachChild(node, (child) => visit(child), context)
	}
	return (node: TypeScript.Node) => TypeScript.visitNode(node, visit)
}
