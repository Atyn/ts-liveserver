import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import { TsTranspiler } from '@ts-liveserver/ts-transpiler'

const CACHE_DIRECTORY = Path.sep + 'node_modules' + Path.sep

type CacheObject = {
	mTime: number
	content: string
}

export default class MiddleWare {
	private cache: Record<string, CacheObject> = {}
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
				const info = await Fs.promises.stat(resolvedFilePath)
				const content = await this.getFileContent(
					resolvedFilePath,
					info.mtimeMs,
				)
				response.set({
					'Content-Type': 'application/javascript',
					ETag: this.startTime + '-' + info.mtimeMs,
				})
				response.send(content)
				break
			}
			default:
				next()
		}
	}
	private async getFileContent(
		filePath: string,
		mTime: number,
	): Promise<string> {
		if (!filePath.includes(CACHE_DIRECTORY)) {
			const result = await this.tsTranspiler.transformFile(filePath)
			return result.outputText
		}
		const cacheObject = this.cache[filePath]
		// Fetch cache?
		if (cacheObject && cacheObject.mTime === mTime) {
			return cacheObject.content
		}
		const result = await this.tsTranspiler.transformFile(filePath)
		// Set cache
		this.cache[filePath] = {
			mTime: mTime,
			content: result.outputText,
		}
		return result.outputText
	}
}
