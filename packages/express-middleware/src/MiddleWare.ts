import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import TypeScript from 'typescript'
import { TsTranspiler, DefaultResolveAlias } from '@ts-liveserver/ts-transpiler'

const CACHE_DIRECTORY = Path.sep + 'node_modules' + Path.sep

type WatchCallback = (filePath: string) => void
type CacheObject = {
	mTime: number
	content: string
}
type Options = {
	path: string
	compilerOptions?: TypeScript.CompilerOptions
	watchCallback?: WatchCallback
}

export default class MiddleWare {
	private cache: Record<string, CacheObject> = {}
	private startTime = new Date().getTime()
	private tsTranspiler
	private rootPath: string
	constructor(options: Options) {
		if (!options.path) {
			throw new Error('No path given for MiddleWare')
		}
		this.rootPath = options.path
		this.tsTranspiler = new TsTranspiler({
			compilerOptions: options.compilerOptions,
			resolveAlias: DefaultResolveAlias,
		})
	}
	public async resolveFilePath(requestPath: string): Promise<string> {
		return await this.tsTranspiler.resolveFilePath(
			Path.resolve(this.rootPath + requestPath),
		)
	}
	public async onRequest(
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	): Promise<void> {
		switch (Path.extname(request.path)) {
			case '.js': {
				let resolvedFilePath = null
				try {
					resolvedFilePath = await this.resolveFilePath(request.path)
				} catch (error) {
					response.sendStatus(404)
					return
				}

				const info = await Fs.promises.stat(resolvedFilePath)
				const code = await this.getFileContent(resolvedFilePath, info.mtimeMs)
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
}
