import CommitParser from '../src/CommitParser'
import VersionType from '../src/enums/VersionType'

describe('CommitParser', () => {
	it('Should interpret commit with just a message', () => {
		const message = 'just a simple message'
		const parser = new CommitParser(message)
		expect(parser.getMessage()).toBe(message)
		expect(parser.getTaskId()).toBe(null)
		expect(parser.getVersionType()).toBe(null)
	})
	it('Should interpret commit with both taskID and versionType', () => {
		const message = 'this is a simple message'
		const versionType = 'major'
		const taskId = 'HELLO'
		const parser = new CommitParser(`${taskId}@${versionType}: ${message}`)
		expect(parser.getMessage()).toBe(message)
		expect(parser.getTaskId()).toBe(taskId)
		expect(parser.getVersionType()).toBe(versionType)
	})
	for (const versionType in VersionType) {
		const message = 'this is a simple message'
		it(`Should interpret version type "${versionType}" correctly`, () => {
			const parser = new CommitParser(`${versionType}: ${message}`)
			expect(parser.getMessage()).toBe(message)
			expect(parser.getVersionType()).toBe(versionType)
		})
	}
})
