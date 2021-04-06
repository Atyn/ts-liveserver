import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import { TsTranspiler } from '@ts-liveserver/ts-transpiler'

const CACHE_DIRECTORY = Path.sep + 'node_modules' + Path.sep


type Options = {
	watch?: boolean
}
type CacheObject = {
	mTime: number
	content: string
}

export default class MiddleWare {
	private cache: Record<string, CacheObject> = {}
	private path: string
	private startTime = new Date().getTime()
	private tsTranspiler = new TsTranspiler({ inlineSourceMap: true })
	private options: Options;
	private watchedFiles = new Map()
	constructor(path = '.', options = {}) {
		this.path = path
		this.options = options
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
				const code = await this.getFileContent(
					resolvedFilePath,
					info.mtimeMs,
				) 
				if(this.options.watch) {
					this.handleWatch(resolvedFilePath)
				}
				response.set(this.getHttpHeaders(info.mtimeMs))
				response.send(code)
				break
			}
			default:
				next()
		}
	}
	private getHttpHeaders(mTime: number): Record<string, string> {
		return {
			'Content-Type': 'application/javascript',
			ETag: this.startTime + '-' + mTime,
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
	private handleWatch(filePath: string) {
		if(!filePath.includes(CACHE_DIRECTORY)) {
			if(!this.watchedFiles.has(filePath)) {
				const watcher = Fs.watch(filePath, {
					persistent: false,
				}, this.onFileChanged.bind(this))
				this.watchedFiles.set(filePath, watcher)
			}
		}
	}
	private onFileChanged(eventType: string, filePath: string) {
		console.log('File changed:', eventType, filePath);
	}
}
