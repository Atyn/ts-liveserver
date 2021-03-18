import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import { TsTranspiler } from '@ts-liveserver/ts-transpiler'

export default class MiddleWare {
	private path: string
	private tsTranspiler = new TsTranspiler()
	constructor(path = '.') {
		this.path = path
	}
	async onRequest(
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	): Promise<void> {
		switch (Path.extname(request.path)) {
			case '.js':
			case '.jsx':
			case '.tsx':
			case '.ts': {
				const fileName = Path.resolve(this.path + request.path)
				if (await this.fileExists(fileName)) {
					const info = await Fs.promises.stat(fileName)
					response.set({
						'Content-Type': 'application/javascript',
						ETag: info.mtimeMs,
					})
					response.send(
						(await this.tsTranspiler.transformFile(fileName)).outputText,
					)
				} else if (!(await this.fileExists(fileName))) {
					const typeScriptFilenName = fileName.replace(
						Path.extname(fileName),
						'.js',
					)
					if (await this.fileExists(typeScriptFilenName)) {
						response.redirect(
							request.path.replace(Path.extname(request.path), '.ts'),
						)
					}
					next()
				}
				break
			}
			default:
				next()
		}
	}
	async fileExists(path: string) {
		try {
			await Fs.promises.readFile(path)
		} catch (error) {
			return false
		}
		return true
	}
}

/*
export default function MiddleWare(path = '.') {
	const tsTranspiler = new TsTranspiler()
	return async function (
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	) {
		switch (Path.extname(request.path)) {
			case '.tsx':
			case '.ts':
			case '.js':
			case '.jsx':
				response.set({ 'Content-Type': 'application/javascript' })
				const fileName = Path.resolve(path + request.path)
				response.send(await tsTranspiler.transformFile(fileName))
				break
			default:
				return next()
		}
		return undefined
	}
}
*/
