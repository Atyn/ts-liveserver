import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import { TsTranspiler } from '@ts-liveserver/ts-transpiler'

export default class MiddleWare {
	private path: string
	private startTime = new Date().getTime()
	private tsTranspiler = new TsTranspiler({ inlineSourceMap: true })
	constructor(path = '.') {
		this.path = path
	}
	async onRequest(
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	): Promise<void> {
		switch (Path.extname(request.path)) {
			case '.js': {
				const resolvedFilePath = await this.tsTranspiler.resolveFilePath(
					Path.resolve(this.path + request.path),
				)
				const result = await this.tsTranspiler.transformFile(resolvedFilePath)
				const info = await Fs.promises.stat(resolvedFilePath)
				response.set({
					'Content-Type': 'application/javascript',
					ETag: this.startTime + '-' + info.mtimeMs,
				})
				response.send(result.outputText)
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
