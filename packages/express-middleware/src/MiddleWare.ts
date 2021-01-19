import Express from 'express'
import Path from 'path'
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
	) {
		switch (Path.extname(request.path)) {
			case '.tsx':
			case '.ts':
			case '.js':
			case '.jsx':
				response.set({ 'Content-Type': 'application/javascript' })
				const fileName = Path.resolve(this.path + request.path)
				response.send(await this.tsTranspiler.transformFile(fileName))
				break
			default:
				return next()
		}
		return undefined
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
