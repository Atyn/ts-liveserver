export default interface IEsmDependencyResolver {
	resolveDependencyName(parentFilePath: string, dependencyName: string): string
}
