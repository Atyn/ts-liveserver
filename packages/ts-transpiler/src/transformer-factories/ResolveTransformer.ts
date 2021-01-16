import TypeScript from 'typescript'
import Path from 'path'

export default class ResolveTransformer implements TypeScript.CustomTransformer {
  private context: TypeScript.TransformationContext
  constructor(context: TypeScript.TransformationContext) {
  	this.context = context
  }
  private resolvePath(a: string, b: string) {
  	const filePath = a
  	const dependencyFilePath = require.resolve(b, {
  		paths: [Path.dirname(filePath)],
  	})
  	const relativeDir =
      Path.relative(
      	Path.dirname(filePath),
      	Path.dirname(dependencyFilePath),
      ) || '.'
  	const relativeDependencyFilePath =
      relativeDir + '/' + Path.basename(dependencyFilePath)
  	return relativeDir + '/' + Path.basename(relativeDependencyFilePath)
  }
  private visit(node: TypeScript.Node) {
  	if (
  		TypeScript.isStringLiteral(node) &&
      TypeScript.isImportDeclaration(node.parent)
  	) {
  		console.log(node.getSourceFile().fileName, node.text);
  		return TypeScript.factory.createStringLiteral(
  			this.resolvePath(node.getSourceFile().fileName, node.text)
  		)
  	}
  	return TypeScript.visitEachChild(node, this.visit.bind(this), this.context)
  }
  transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {    
  /*
    console.log(
  		node.resolvedModules
    )
    */
  	return TypeScript.visitNode(node, this.visit.bind(this))
  }
  transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
  	return node
  }
}
