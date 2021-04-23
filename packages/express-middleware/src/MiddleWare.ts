import Express from 'express'
import Path from 'path'
import Fs from 'fs'
import TypeScript from 'typescript'
import { TsTranspiler, DefaultResolveAlias } from '@ts-liveserver/ts-transpiler'
import WatchScriptContent from './WatchScript'

const CACHE_DIRECTORY = Path.sep + 'node_modules' + Path.sep
const watchScriptContent = new WatchScriptContent()

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
	private watchCallback?: WatchCallback
	private rootPath: string
	private watchedFiles = new Map()
	constructor(options: Options) {
		if (!options.path) {
			throw new Error('No path given for MiddleWare')
		}
		this.rootPath = options.path
		this.watchCallback = options.watchCallback
		this.tsTranspiler = new TsTranspiler({
			compilerOptions: options.compilerOptions,
			resolveAlias: DefaultResolveAlias,
		})
	}
	async onRequest(
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	): Promise<void> {
		if (this.watchCallback && request.path === watchScriptContent.getUrl()) {
			response.set(this.getHttpHeaders(0))
			response.send(watchScriptContent.getCode())
			return
		}
		switch (Path.extname(request.path)) {
			case '.js': {
				let resolvedFilePath = null
				try {
					resolvedFilePath = await this.tsTranspiler.resolveFilePath(
						Path.resolve(this.rootPath + request.path),
					)
				} catch (error) {
					response.sendStatus(404)
					return
				}
				const info = await Fs.promises.stat(resolvedFilePath)
				const code = await this.getFileContent(resolvedFilePath, info.mtimeMs)
				response.set(this.getHttpHeaders(info.mtimeMs))
				if (this.watchCallback && !resolvedFilePath.includes(CACHE_DIRECTORY)) {
					this.handleWatch(resolvedFilePath)
					response.send(
						code + '\n' + watchScriptContent.getImportCode(request.path),
					)
				} else {
					response.send(code)
				}
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
		if (!this.watchedFiles.has(filePath)) {
			const watcher = Fs.watch(
				filePath,
				{
					persistent: false,
				},
				() => {
					if (this.watchCallback) {
						this.watchCallback(filePath)
					}
				},
			)
			this.watchedFiles.set(filePath, watcher)
		}
	}
}
