import './ModuleD'

export async function getSomething() {
	const content = await import('./ModuleC')
	const unified = await import('remark-parse')
	// eslint-disable-next-line no-console
	console.log('unified:', unified)
	const remarkParse = await import('unified')
	// eslint-disable-next-line no-console
	console.log('remarkParse:', remarkParse)
	return content.default
}
