import TypeScript from "typescript";
import Path from "path";
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
	private context: TypeScript.TransformationContext;
	private moduleResolutionHost: TypeScript.ModuleResolutionHost;
	constructor(context: TypeScript.TransformationContext) {
		this.context = context;
		this.moduleResolutionHost = TypeScript.createCompilerHost(
			this.context.getCompilerOptions(),
		);
	}
	private resolvePath(a: string, b: string) {
		const resolveResults = TypeScript.resolveModuleName(
			b,
			a,
			this.context.getCompilerOptions(),
			this.moduleResolutionHost,
		);
		const resolvedFileName = resolveResults?.resolvedModule?.resolvedFileName;
		if (!resolvedFileName) {
			throw new Error("Could not resolve" + b + "from module" + a);
		}
		const filePath = a;
		/*
		const dependencyFilePath = require.resolve(b, {
			paths: [Path.dirname(filePath)],
		})
		*/
		const dependencyFilePath = resolvedFileName;
		const pathObj = Path.parse(dependencyFilePath);
		const relativeDir =
			Path.relative(Path.dirname(filePath), pathObj.dir) || ".";
		return relativeDir + "/" + pathObj.name + pathObj.ext;
	}
	private visit(node: TypeScript.Node) {
		if (
			TypeScript.isStringLiteral(node) &&
			TypeScript.isImportDeclaration(node.parent)
		) {
			return TypeScript.factory.createStringLiteral(
				this.resolvePath(node.getSourceFile().fileName, node.text),
			);
		}
		return TypeScript.visitEachChild(node, this.visit.bind(this), this.context);
	}
	transformSourceFile(node: TypeScript.SourceFile): TypeScript.SourceFile {
		return TypeScript.visitNode(node, this.visit.bind(this));
	}
	transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node;
	}
}
