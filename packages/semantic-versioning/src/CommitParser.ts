import VersionType from './enums/VersionType'
const REGEXP = /^((.+)(?=:))?(.+)/gm
// type VersionType = 'major' | 'minor' | 'patch' | 'trivial'

export default class CommitParser {
	private commitMessage: string
	constructor(commitMessage: string) {
		if (typeof commitMessage !== 'string') {
			throw new Error('No commitMessage was given to the constructor')
		}
		this.commitMessage = commitMessage
	}
	getTaskId(): string | null {
		const result = new RegExp(REGEXP).exec(this.commitMessage)
		if (!result) {
			return null
		}
		if (result[1] === undefined) {
			return null
		}
		const list = result[1].split('@')
		if (list.length === 1) {
			return result[1]
		}
		return list[0]
	}
	getVersionType(): string | null {
		const result = new RegExp(REGEXP).exec(this.commitMessage)
		if (!result) {
			return null
		}
		if (result[1] === undefined) {
			return null
		}
		const list = result[1].split('@')
		if (list.length === 1) {
			return result[1]
		}
		return list[1]
	}
	getMessage(): string | null {
		const result = new RegExp(REGEXP).exec(this.commitMessage)
		if (!result) {
			return null
		}
		return result[3].replace(/^\:\s+/, '')
	}
}
