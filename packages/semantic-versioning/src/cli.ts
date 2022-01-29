import CommitParser from './CommitParser'
import GitIntegrator from './GitIntegrator'
import VersionUtility from './VersionUtility'

const gitIntegrator = new GitIntegrator()
const versionUtility = new VersionUtility()

main()

async function main() {
	const gitTags = await gitIntegrator.getAllTags()
	const latestVersion = await versionUtility.getLatestVersion(gitTags)
	const commitMessages = await gitIntegrator.getDiffCommitMessages(
		'v2.0.0',
		'HEAD',
	)
	const versionType = versionUtility.getVersionType(commitMessages)
	console.log(commitMessages)
	console.log(gitTags)
	console.log('latestVersion:', latestVersion)
	console.log('versionType:', versionType)
	if (versionType !== null) {
		const nextVersion = versionUtility.getNextVersion(versionType, gitTags)
		console.log('nextVersion:', nextVersion)
	}
}
