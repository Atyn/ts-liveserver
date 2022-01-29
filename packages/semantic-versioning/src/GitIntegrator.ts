import Util from 'util'
import ChildProcess from 'child_process'
const Exec = Util.promisify(ChildProcess.exec)

export default class GitIntegrator {
	/**
	 * Return a list of commit hashes that differs.
	 *
	 */
	async getDiffCommits(from: string, to: string): Promise<string[]> {
		const { stdout } = await Exec(`git log ${from}..${to} --pretty=format:"%h"`)
		return stdout
			.trim()
			.split('\n')
			.filter((str: string) => str !== '')
	}
	/**
	 * Return a list of commit messages
	 */
	async getDiffCommitMessages(from: string, to: string): Promise<string[]> {
		const list = await this.getDiffCommits(from, to)
		return Promise.all(list.map((hash: string) => this.getCommitMessage(hash)))
	}
	async getAllTags(): Promise<string[]> {
		const { stdout } = await Exec('git tag -l --sort=v:refname')
		return stdout.trim().split('\n').reverse()
	}
	async getCommitMessage(commitHash: string) {
		const { stdout } = await Exec(`git show -s --format=%B ${commitHash}`)
		return stdout.trim()
	}
}
