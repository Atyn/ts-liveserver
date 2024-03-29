import TypeScript from 'typescript'

const CompilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsx: TypeScript.JsxEmit.React,
	checkJs: false,
	noResolve: true,
	resolveJsonModule: false,
	esModuleInterop: true,
	skipLibCheck: true,
	experimentalDecorators: true,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: false,
}

export default CompilerOptions
