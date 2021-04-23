export default class ArgParser {
	private args: string[]
	constructor(args: string[]) {
		this.args = args
	}
	getPath(): string | undefined {
		return this.args.find((name) => name.startsWith('.'))
	}
	shouldUseWatch(): boolean {
		return this.args.some((arg) => arg.startsWith('--watch'))
	}
	shouldUseSourceMaps(): boolean {
		return this.args.some((arg) => arg.startsWith('--sourcemaps'))
	}
	getProxyRules(): string[] {
		const str = this.args.find((name) => name.startsWith('--proxy'))
		if (!str) {
			return []
		}
		return str.replace('--proxy=', '').split(',')
	}
}

/* 

const options = {
	path: argArray.find((name) => name.startsWith('.')) || process.cwd(),
	watch: argArray.some((arg) => arg.startsWith('--watch')),
	inlineSourceMap: argArray.some((arg) => arg.startsWith('--sourcemaps')),
}
*/
