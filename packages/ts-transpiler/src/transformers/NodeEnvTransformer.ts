import TypeScript from 'typescript'

const BUFFER_NAME = 'Buffer'
const BUFFER_PACKAGE_NAME = 'buffer'

const NODE_PROCESS: Record<string, string> = {
	arch: 'x64',
}
const NODE_PROCESS_ENV: Record<string, string> = {
	get NODE_ENV(): string {
		return process.env.NODE_ENV || 'production'
	},
	NODE_DEBUG: '',
}

/*
Replaces process.env.NODE_ENV in code
*/
export default class NodeEnvTransformer
	implements TypeScript.CustomTransformer {
	private context: TypeScript.TransformationContext
	constructor(context: TypeScript.TransformationContext) {
		this.context = context
	}
	public transformSourceFile(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		const withoutNodeEnv = this.replaceNodeEnv(sourceFile)
		const withoutProcess = this.replaceNodeProcess(withoutNodeEnv)
		const withoutGlobal = this.replaceGlobal(withoutProcess)
		return this.withBuffer(withoutGlobal)
	}
	public transformBundle(node: TypeScript.Bundle): TypeScript.Bundle {
		return node
	}
	// process.env.NODE_ENV -> 'production'
	private replaceNodeEnv(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (!/process\.env/gm.test(sourceFile.text)) {
			return sourceFile
		}
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isPropertyAccessExpression(node) &&
				TypeScript.isPropertyAccessExpression(node.expression) &&
				TypeScript.isIdentifier(node.name) &&
				TypeScript.isIdentifier(node.expression.expression) &&
				TypeScript.isIdentifier(node.expression.name) &&
				node.expression.name.getText() === 'env' &&
				node.expression.expression.getText() === 'process'
			) {
				const key = node.name.getText()
				if (key in NODE_PROCESS_ENV) {
					return TypeScript.factory.createStringLiteral(NODE_PROCESS_ENV[key])
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	// global.hello -> globalThis.hello
	private replaceGlobal(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (!/global/gm.test(sourceFile.text)) {
			return sourceFile
		}
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isElementAccessExpression(node) &&
				TypeScript.isIdentifier(node.expression) &&
				node.expression.text === 'global'
			) {
				const newNode = TypeScript.factory.updateElementAccessExpression(
					node,
					TypeScript.factory.createIdentifier('globalThis'),
					node.argumentExpression,
				)
				return TypeScript.visitEachChild(newNode, visit, this.context)
			} else if (
				TypeScript.isPropertyAccessExpression(node) &&
				TypeScript.isIdentifier(node.expression) &&
				node.expression.text === 'global'
			) {
				const newNode = TypeScript.factory.updatePropertyAccessExpression(
					node,
					TypeScript.factory.createIdentifier('globalThis'),
					node.name,
				)
				return TypeScript.visitEachChild(newNode, visit, this.context)
			}

			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	// process.arch -> 'x64'
	private replaceNodeProcess(
		sourceFile: TypeScript.SourceFile,
	): TypeScript.SourceFile {
		if (!/process/gm.test(sourceFile.text)) {
			return sourceFile
		}
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (
				TypeScript.isPropertyAccessExpression(node) &&
				TypeScript.isIdentifier(node.name) &&
				TypeScript.isIdentifier(node.expression) &&
				node.expression.getText() === 'process'
			) {
				const key = node.name.getText()
				if (key in NODE_PROCESS) {
					return TypeScript.factory.createStringLiteral(NODE_PROCESS[key])
				}
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		return TypeScript.visitEachChild(sourceFile, visit, this.context)
	}
	// process.arch -> 'x64'
	private withBuffer(sourceFile: TypeScript.SourceFile): TypeScript.SourceFile {
		if (this.isIdentifierDeclared(sourceFile, BUFFER_NAME)) {
			return sourceFile
		}
		if (!this.isIdentifierUsed(sourceFile, BUFFER_NAME)) {
			return sourceFile
		}
		return TypeScript.factory.updateSourceFile(sourceFile, [
			TypeScript.factory.createImportDeclaration(
				undefined,
				undefined,
				TypeScript.factory.createImportClause(
					false,
					undefined,
					TypeScript.factory.createNamedImports([
						TypeScript.factory.createImportSpecifier(
							TypeScript.factory.createIdentifier(BUFFER_NAME),
							TypeScript.factory.createIdentifier(BUFFER_NAME),
						),
					]),
				),
				TypeScript.factory.createStringLiteral(BUFFER_PACKAGE_NAME),
			),
			...sourceFile.statements,
		])
	}
	private isIdentifierDeclared(
		sourceFile: TypeScript.Node,
		name: string,
	): boolean {
		let isDeclared = false
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (isDeclared) {
				return node
			}
			if (
				TypeScript.isVariableDeclaration(node) &&
				TypeScript.isIdentifier(node.name) &&
				node.name.text === name
			) {
				isDeclared = true
				return node
			} else if (
				TypeScript.isFunctionDeclaration(node) &&
				node.name &&
				TypeScript.isIdentifier(node.name) &&
				node.name.text === name
			) {
				isDeclared = true
				return node
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		TypeScript.visitEachChild(sourceFile, visit, this.context)
		return isDeclared
	}
	private isIdentifierUsed(sourceFile: TypeScript.Node, name: string): boolean {
		let isUsed = false
		const visit = (node: TypeScript.Node): TypeScript.Node => {
			if (isUsed) {
				return node
			}
			if (TypeScript.isIdentifier(node) && node.text === name) {
				isUsed = true
				return node
			}
			return TypeScript.visitEachChild(node, visit, this.context)
		}
		TypeScript.visitEachChild(sourceFile, visit, this.context)
		return isUsed
	}
}
