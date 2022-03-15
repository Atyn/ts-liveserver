import TypeScript from 'typescript'

export default class ModuleResolutionHost
	implements TypeScript.ModuleResolutionHost
{
	fileExists = (fileName: string): boolean => {
		return TypeScript.sys.fileExists(fileName)
	}
	readFile = (fileName: string): string | undefined => {
		return TypeScript.sys.readFile(fileName)
	}
}
