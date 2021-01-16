const message = getInput('message')

console.log('Received message:', message)

function getInput(name) {
	const val =
		process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
	if (!val) {
		throw new Error(`Input required and not supplied: ${name}`)
	}
	return val
}
