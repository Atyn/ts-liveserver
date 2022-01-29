import VersionUtility from '../src/VersionUtility'
import VersionType from '../src/enums/VersionType'

const GIT_TAGS = ['v1.0.2', 'v1.2.2', 'v0.0.2']

describe('VersionUtility', () => {
	it('Should show correct latest version', () => {
		const versionUtility = new VersionUtility()
		expect(versionUtility.getLatestVersion(GIT_TAGS)).toBe('1.2.2')
	})
	it('Should increment correctly with major', () => {
		const versionUtility = new VersionUtility()
		expect(versionUtility.getNextVersion(VersionType.major, GIT_TAGS)).toBe(
			'2.0.0',
		)
	})
	it('Should increment correctly with minor', () => {
		const versionUtility = new VersionUtility()
		expect(versionUtility.getNextVersion(VersionType.minor, GIT_TAGS)).toBe(
			'1.3.0',
		)
	})
	it('Should increment correctly with patch', () => {
		const versionUtility = new VersionUtility()
		expect(versionUtility.getNextVersion(VersionType.patch, GIT_TAGS)).toBe(
			'1.2.3',
		)
	})
	it('Should increment correctly with trivial', () => {
		const versionUtility = new VersionUtility()
		expect(versionUtility.getNextVersion(VersionType.trivial, GIT_TAGS)).toBe(
			null,
		)
	})
	it('Should return major version type', () => {
		const commits = [
			'minor: addedfeature',
			'major: breaking change',
			'patch: a fix',
		]
		const versionUtility = new VersionUtility()
		expect(versionUtility.getVersionType(commits)).toBe(VersionType.major)
	})
	it('Should return minor version type', () => {
		const commits = ['minor: addedfeature', 'patch: a fix']
		const versionUtility = new VersionUtility()
		expect(versionUtility.getVersionType(commits)).toBe(VersionType.minor)
	})
	it('Should return patch version type', () => {
		const commits = ['patch: a fix']
		const versionUtility = new VersionUtility()
		expect(versionUtility.getVersionType(commits)).toBe(VersionType.patch)
	})
})
