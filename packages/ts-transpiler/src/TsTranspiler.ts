import Fs from 'fs'
import TypeScript from 'typescript'
import ResolveTransformer from './transformers/ResolveTransformer'
import CommonJsTransformer from './transformers/CommonJsTransformer'

const compilerOptions: TypeScript.CompilerOptions = {
	allowJs: true,
	jsx: TypeScript.JsxEmit.React,
	/*
	jsx: TypeScript.JsxEmit.React,
	jsxImportSource: 'react',
	jsxFragmentFactory: 'React.Fragment',
	jsxFactory: 'React.createElement',
	*/
	checkJs: false,
	noResolve: false,
	esModuleInterop: true,
	skipLibCheck: true,
	target: TypeScript.ScriptTarget.ES2020,
	declaration: false,
	module: TypeScript.ModuleKind.ES2020,
	moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
	sourceMap: false,
}

const transformers: TypeScript.CustomTransformers = {
	after: [
		(context) => new CommonJsTransformer(context),
		(context) => new ResolveTransformer(context),
	],
}

export default class TsTranspiler {
	transformCode(
		code: string,
		fileName: string,
	): string {
		const results = TypeScript.transpileModule(code, {
			compilerOptions: compilerOptions,
			fileName: fileName,
			// reportDiagnostics: true,
			// renamedDependencies: {},
			transformers: transformers,
		})

		const output = results.outputText.toString()
        const exportsRegexp = /exports\.([^=() ]+)[ ]*=/gm
        const definePropertyRegexp = /Object\.defineProperty\(exports, "([a-zA-Z]+)"/gm
        const exportNames: string[] = []
        let exportsMatch = null
        let definePropertyMatch = null

        if(output.match(/[^\t ]module.exports[ ]*=[ ]*{[ \t\n]*[^}]/m)) {
            return `var exports = {};var module = {};\n${output.replace(/[^\t ]module.exports[ ]*=[ ]*{([ \t\n]*[^}])/, 'export {$1')}\n`
        } else if(output.includes('module.exports')) {
            return `var exports = {};var module = { exports: {} };\n${output}\nexport default module.exports;`
        } else {
            while((exportsMatch = exportsRegexp.exec(output))) {
                const exportName = exportsMatch[1].trim()
                if(exportName !== 'default' && exportName.replace(/[^a-zA-Z]/g, '') === exportName && !exportNames.includes(exportName)) {
                    exportNames.push(`${exportName}`)
                }
            }
    
            while((definePropertyMatch = definePropertyRegexp.exec(output))) {
                const exportName = definePropertyMatch[1].trim()
                if(exportName !== 'default' && exportName.replace(/[^a-zA-Z]/g, '') === exportName && !exportNames.includes(exportName)) {
                    exportNames.push(`${exportName}`)
                }
            }
    
            if(exportNames.length) {
                const exportVaribles = [];
                for(const exportName of exportNames) {
                    if(!output.includes(`function ${exportName}(`) && !output.match(new RegExp(`[\t\n ]+${exportName}[\t\n ]+`)) && !output.match(new RegExp(`exports.${exportName}[ ]*=[ ]*${exportName}`))) {
                        exportVaribles.push(`var ${exportName} = exports.${exportName};`)
                    }
                }
                return `var exports = {};\n${output}\n${exportVaribles.join('\n')}\nexport { ${exportNames.join(', ')} };\nexport default { ${exportNames.join(', ')} };`
            }
        }

        return output.replace('export {};', 'export default {};')
	}
	async transformFile(fileName: string): Promise<Buffer | string> {
		const buffer = await Fs.promises.readFile(fileName)
		return this.transformCode(buffer.toString(), fileName)
	}
}
