import './ModuleD'

let mod = {}

async function main() {
	mod = await import('./ModuleC')
}

main()

/*
if (process.env.NODE_ENV === 'production') {
	mod = await import('./ModuleC.js')
} else {
	mod = await import('./ModuleC.js')
}
*/

export default mod
