import TsTranspiler from '../src/TsTranspiler'
import Path from 'path'
import Fs from 'fs'

describe('TsTranspiler', () => {
	it('Transpile a module', async () => {
		const inputFileName = './ModuleA.ts'
		const transpiler = new TsTranspiler()
		const results = await transpiler.transformFile(
			Path.resolve(__dirname, 'inputData', inputFileName),
		)
		console.log(
			Fs.readFileSync(
				Path.resolve(__dirname, 'outputData', 'ModuleA.js'),
			).toString(),
		)
		expect(results).toBe(
			Fs.readFileSync(
				Path.resolve(__dirname, 'outputData', 'ModuleA.js'),
			).toString(),
		)
	})
})
