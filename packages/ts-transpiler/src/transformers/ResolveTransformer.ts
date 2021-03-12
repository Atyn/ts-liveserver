import * as TypeScript from 'typescript'
import * as Path from 'path'
import * as Fs from 'fs'
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
	// Return an aboslute path e.g. /tmp/a-apath/node_modules/hello/module.js
	private resolveDependencyPath(
		parentPath: string,
		dendencyName: string,
	): string {
        const parentDirectory = Path.dirname(parentPath);
		if(dendencyName.startsWith('.')) {
            return dendencyName.endsWith('.js') || dendencyName.endsWith('.json') ? dendencyName : dendencyName + '.js'
        }
        const dendencyNameParts = dendencyName.split('/');
        const packageName = dendencyName.startsWith('@') ? dendencyNameParts.slice(0, 2).join(Path.sep) : dendencyNameParts[0]
        const directories = parentDirectory.split(Path.sep)

        while(directories.length) {
            const packagePath = Path.join(directories.join(Path.sep), 'node_modules', packageName)
            let stat = null
            try {
                stat = Fs.statSync(packagePath)
            } catch(error) {
                // Ignore error
            }
            if(stat && stat.isDirectory()) {
                const realPackagePath = Fs.realpathSync(packagePath);
                const childPath = dendencyName.startsWith('@') ? dendencyNameParts.slice(2).join(Path.sep) : dendencyNameParts.slice(1).join(Path.sep)
                if(childPath) {
                    const childPathWithExtension = childPath.endsWith('.js') || childPath.endsWith('.json') ? childPath : childPath + '.js'
                    return Path.relative(parentDirectory, Path.join(realPackagePath, childPathWithExtension))
                } else {
                    const packageJson = JSON.parse(Fs.readFileSync(Path.join(packagePath, 'package.json')).toString())
                    const main = packageJson.main.endsWith('js') ? Path.normalize(packageJson.main) : Path.join(Path.normalize(packageJson.main), 'index.js')
                    return Path.relative(parentDirectory, Path.join(realPackagePath, main))
                }
            } else {
                directories.pop()
            }
        }

        throw new Error(
            'Could not resolve' + dendencyName + 'from module' + parentPath,
        )
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
