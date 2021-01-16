import TypeScript from 'typescript'

export default class ModuleTransformer implements TypeScript.CustomTransformer {
	transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		TypeScript.forEachChild(sourceFile, (node: TypeScript.Node) => {
			if (TypeScript.isImportDeclaration(node)) {
				if (TypeScript.isStringLiteral(node.moduleSpecifier)) {
					node.moduleSpecifier.text = 'yoyoy'
					console.log(node.moduleSpecifier.text)
				}
			}
		})
		return sourceFile
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
}
