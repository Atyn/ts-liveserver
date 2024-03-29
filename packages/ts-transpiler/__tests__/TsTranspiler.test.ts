import TsTranspiler from '../src/TsTranspiler'
import Path from 'path'

describe('TsTranspiler', () => {
	it('Transpile a module', async () => {
		const inputFileName = './ModuleA.tsx'
		const transpiler = new TsTranspiler()
		const results = (
			await transpiler.transformFile(
				Path.resolve(__dirname, 'inputData', inputFileName),
			)
		).outputText
		expect(results).toMatchSnapshot()
	})
})
