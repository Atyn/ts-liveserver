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
	// eslint-disable-next-line no-console
	console.log('QrImage:', QrImage)
	const { size, path } = QrImage.svgObject('github.com/Atyn/ts-liveserver', {
		type: 'svg',
	})
	const div = document.createElement('div')
	div.innerHTML = `
			<svg style="max-width: 200px;" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
				<path d="${path}" />
			</svg>
	`
	document.body.appendChild(div)
	return content.default
}
