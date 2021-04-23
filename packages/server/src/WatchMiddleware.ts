import Path from 'path'
import Express from 'express'
import Fs from 'fs'

const IGNORE_DIRECTORY = Path.sep + 'node_modules' + Path.sep
const WATCH_SCRIPT_URL = '/watch-module-from-middleware.js'

type JsFileResolver = (filePath: string) => Promise<string>
type Options = {
	path: string
	resolveJsFile: JsFileResolver
	onChange: (filePath: string) => void
}

export default class WatchMiddleware {
	private rootPath: string
	private resolveJsFile: JsFileResolver
	private watchedFiles = new Set()
	private reportChange: (filePath: string) => void
	private startTime = new Date().getTime()
	constructor(options: Options) {
		this.rootPath = options.path
		this.resolveJsFile = options.resolveJsFile
		this.reportChange = options.onChange
	}
	async onRequest(
		request: Express.Request,
		response: Express.Response,
		next: () => void,
	): Promise<void> {
		if (request.path === WATCH_SCRIPT_URL) {
			response.set({
				'Content-Type': 'application/javascript',
				ETag: this.startTime,
			})
			response.send(this.getWatchScriptContent())
			return
		}
		if (request.path.includes(IGNORE_DIRECTORY)) {
			next()
			return
		}
		let resolvedFilePath = null
		try {
			resolvedFilePath = await this.resolveFilePath(request.path)
		} catch (error) {
			// Exit silently
		}
		if (resolvedFilePath === null) {
			next()
			return
		}
		this.watchFile(resolvedFilePath)
		if (Path.extname(resolvedFilePath) === '.html') {
			const info = await Fs.promises.stat(resolvedFilePath)
			const buffer = await Fs.promises.readFile(resolvedFilePath)
			response.set({
				'Content-Type': 'text/html; charset=UTF-8',
				ETag: this.startTime + '-' + info.mtimeMs,
			})
			response.send(buffer + '\n' + this.getHtmlWatchContent())
			return
		}
		next()
	}
	private watchFile(filePath: string) {
		if (this.watchedFiles.has(filePath)) {
			return
		}
		this.watchedFiles.add(filePath)
		Fs.watch(filePath, { persistent: false }, () => this.reportChange(filePath))
	}
	private async resolveFilePath(requestPath: string): Promise<string | null> {
		switch (Path.extname(requestPath)) {
			case '.js':
				return this.resolveJsFile(requestPath)
			case '.html': {
				const path = Path.resolve(this.rootPath + requestPath)
				const info = await Fs.promises.stat(path)
				return path
			}
		}
		return null
	}
	private getHtmlWatchContent() {
		return `<script type="module" src="${WATCH_SCRIPT_URL}"></script>`
	}
	private getWatchScriptContent() {
		return `const webSocket = new WebSocket('ws://' + location.host + '/watch');
  webSocket.onmessage = (event) => {
    if(event.data === 'reload') {
      location.reload()
    } 
  }`
	}
}
