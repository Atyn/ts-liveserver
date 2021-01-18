import Express from 'express'
import Path from 'path'
import { TsTranspiler } from '@ts-liveserver/ts-transpiler'

const tsTranspiler = new TsTranspiler()

export default async function MiddleWare(
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
			const fileName = Path.resolve('.' + request.path)
			response.send(await tsTranspiler.transformFile(fileName))
			break
		default:
			return next()
	}
}
