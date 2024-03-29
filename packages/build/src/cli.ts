#!/usr/bin/env node

import Deployer from './Deployer'
import { TsTranspiler, DefaultResolveAlias } from '@ts-liveserver/ts-transpiler'

const inputFiles = getInputFiles()
const outputDirectory = getOutputDirectory()

const transpiler = new TsTranspiler({
	resolveAlias: DefaultResolveAlias,
})
const deployer = new Deployer(outputDirectory, async (fileName) => {
	const resolvedFileName = await transpiler.resolveFilePath(fileName)
	const result = await transpiler.transformFile(resolvedFileName)
	return result.outputText
})
// eslint-disable-next-line no-console
console.log(`Deploy directory: ${outputDirectory}`)
// eslint-disable-next-line no-console
console.log(`Files: ${inputFiles.join(',')}`)

deployer
	.deployFiles(inputFiles)
	.then((fileList) => {
		// eslint-disable-next-line no-console
		console.log('Deployed files:', fileList)
	})
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error(error)
		process.exit(1)
	})

function getOutputDirectory(): string {
	for (const args of process.argv) {
		if (args.startsWith('--directory=')) {
			return args.split('=')[1]
		}
	}
	throw new Error('--directory= was not provided')
}
function getInputFiles(): string[] {
	const list = Array.from(process.argv)
		.filter((_, index) => index > 1)
		.filter(
			(str) =>
				str.endsWith('.js') || str.endsWith('.ts') || str.endsWith('.mjs'),
		)
	if (list.length === 0) {
		throw new Error('No files was provided')
	}
	return list
}
