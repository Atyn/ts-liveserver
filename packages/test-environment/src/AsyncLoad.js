import './ModuleD'

export async function getSomething() {
	const content = await import('./ModuleC')
	const [remarkParse, unified, QrImage, libphonenumber] = await Promise.all([
		import('remark-parse'),
		import('unified'),
		import('qr-image'),
		import('libphonenumber-js'),
	])
	// eslint-disable-next-line no-console
	console.log('unified:', unified)
	// eslint-disable-next-line no-console
	console.log('remarkParse:', remarkParse)
	// eslint-disable-next-line no-console
	console.log('QrImage:', QrImage)
	// eslint-disable-next-line no-console
	console.log('libphonenumber:', libphonenumber)
	const { size, path } = QrImage.default.svgObject(
		'github.com/Atyn/ts-liveserver',
		{
			type: 'svg',
		},
	)
	const div = document.createElement('div')
	div.innerHTML = `
			<svg style="max-width: 200px;" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
				<path d="${path}" />
			</svg>
	`
	document.body.appendChild(div)
	return content.default
}
