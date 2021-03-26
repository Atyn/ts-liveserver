import './ModuleD'

export async function getSomething() {
	const content = await import('./ModuleC')
	return content.default
}
