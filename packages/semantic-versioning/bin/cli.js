function getArguments() {
	const args = {
		skipDependencyCompilation: false,
		clearCache: false,
	}

	for (const arg of process.argv) {
		if (arg.startsWith('--skipDependencyCompilation')) {
			args.skipDependencyCompilation = true
		} else if (arg.startsWith('--clearCache')) {
			args.clearCache = true
		}
	}

	return args
}

process.on('unhandledRejection', (reason) => {
	// eslint-disable-next-line no-console
	console.error(reason)
	process.exit(1)
})
