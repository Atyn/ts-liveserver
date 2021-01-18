import TypeScript from 'typescript'
import ResolveTransformer from '../src/transformer-factories/ResolveTransformer'

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsxFactory: 'react',
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: false,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
}

const transformers: TypeScript.CustomTransformers = {
	after: [(context: TypeScript.TransformationContext) => new ResolveTransformer(context)],
}

const srcCode = `
import Hello from './__tests__/data/Hello'
const str: string = Hello
export defult str
`

const expectedOutputCode = `
import Hello from './__tests__/data/Hello.js';
var str = Hello;
export defult str;
`

describe('Render App', () => {
	it('should render without crashing', async () => {
		const results = await TypeScript.transpileModule(srcCode, {
			compilerOptions: compilerOptions,
			fileName: './Yo.ts',
			reportDiagnostics: true,
			transformers: transformers,
		})
		expect(results.outputText).toBe(expectedOutputCode)
	})
})
