type ReturnType = {
	path: string
	ignore?: boolean
}

export default interface IEsmDependencyResolver {
	resolveDependencyName(
		parentFilePath: string,
		dependencyName: string,
	): ReturnType
}
