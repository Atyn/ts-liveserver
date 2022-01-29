import * as Semver from 'semver'
import VersionType from './enums/VersionType'
import CommitParser from './CommitParser'

export default class VersionUtility {
	getNextVersion(type: VersionType, gitTags: string[]): string | null {
		const latest = this.getLatestVersion(gitTags)
		if (latest === null) {
			return null
		}
		return Semver.inc(latest, type as Semver.ReleaseType)
	}
	getLatestVersion(gitTags: string[]): string | null {
		const list = this.sortAndCleanTags(gitTags)
		return list[list.length - 1]
	}
	sortAndCleanTags(gitTags: string[]): (string | null)[] {
		return gitTags
			.map((gitTag: string) => Semver.clean(gitTag))
			.filter(Boolean)
			.sort((a: string, b: string) => Semver.compare(a, b))
	}
	getVersionType(commitMessages: string[]): VersionType | null {
		const versionTypes = commitMessages
			.map((commitMessage: string) =>
				new CommitParser(commitMessage).getVersionType(),
			)
			.filter(Boolean)
		const set = new Set(versionTypes)
		if (set.has(VersionType.major)) {
			return VersionType.major
		}
		if (set.has(VersionType.minor)) {
			return VersionType.minor
		}
		if (set.has(VersionType.patch)) {
			return VersionType.patch
		}
		return null
	}
}
