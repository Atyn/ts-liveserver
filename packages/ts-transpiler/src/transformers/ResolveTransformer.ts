import TypeScript from 'typescript'
import Path from 'path'
import FS from 'fs'
/*
class ModuleResolutionHost implements TypeScript.ModuleResolutionHost {
	fileExists(fileName: string): boolean
	readFile(fileName: string): string | undefined
	trace?(s: string): void
	directoryExists?(directoryName: string): boolean
	realpath?(path: string): string
	getCurrentDirectory?(): string
	getDirectories?(path: string): string[]
}
*/

/* eslint-disable no-console*/

export default class ResolveTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	private moduleResolutionHost: TypeScript.ModuleResolutionHost
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		)
	}
	// Return a relative path to the module
	private resolveDependencyPath(
		parentPath: string,
		dependencyName: string,
	): string {
        const parentDirectory = Path.dirname(parentPath)

		if(dependencyName.startsWith('.')) {
            if(dependencyName.endsWith('.js') || dependencyName.endsWith('.json')) {
                return dependencyName;
            }
            return dependencyName + '.js';
        }

		return Path.relative(parentDirectory, require.resolve(dependencyName, {
            paths: this.getResolvePaths(parentDirectory),
        }))
	}
    // Returns paths used for resolving with require.resolve() (same method that Node.js is using for modules)
    private getResolvePaths(directory: string): string[] {
        const paths = [];
        const directories = directory.split(Path.sep);
        while(directories.length) {
            paths.push(directories.join(Path.sep) + Path.sep + 'node_modules');
            directories.pop();
        }
        return paths;
    }
	private visit(node: TypeScript.Node) {
		if (
			node.parent &&
			TypeScript.isStringLiteral(node) &&
			(TypeScript.isExportDeclaration(node.parent) ||
				TypeScript.isImportDeclaration(node.parent))
		) {
			return TypeScript.factory.createStringLiteral(
				this.resolveDependencyPath(node.getSourceFile().fileName, node.text),
			)
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
