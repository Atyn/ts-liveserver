const URL = '/watch-resource-script.js'

export default class WatchScript {
	public getUrl() {
		return URL
	}
	public getCode(): string {
		return `
      const list = [];
      export function watch(name) {
        list.push(name);
      }
    `
	}
	public getImportCode(name: string): string {
		return `import("${URL}").then(module => module.watch("${name}"));`
	}
}
