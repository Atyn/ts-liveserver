import TypeScript from 'typescript'
import CompilerOptions from './CompilerOptions'

const compilerHost = TypeScript.createCompilerHost(CompilerOptions)
const program = TypeScript.createProgram({
	rootNames: [],
	options: CompilerOptions,
	host: compilerHost,
})
