import './ModuleD'

export async function getSomething() {
	const content = await import('./ModuleC')
	const unified = await import('remark-parse')
	// eslint-disable-next-line no-console
	console.log('unified:', unified)
	const remarkParse = await import('unified')
	// eslint-disable-next-line no-console
	console.log('remarkParse:', remarkParse)
	const mod = await import('qr-image')
	const QrImage = mod.default
	console.log('QrImage:', QrImage)
	// const { size, path } = QrImage.svgObject(this.url, { type: 'svg' });
	return content.default
}
