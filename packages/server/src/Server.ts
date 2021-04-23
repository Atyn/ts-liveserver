import HttpProxy from 'http-proxy'
import Express from 'express'
import Http from 'http'
import Path from 'path'
import { createProxyMiddleware } from 'http-proxy-middleware'
import MiddleWare from '@ts-liveserver/express-middleware'
import ServeIndex from 'serve-index'
import WatchMiddleware from './WatchMiddleware'
import * as WebSocket from 'ws'

type Options = {
	watch?: boolean
	path: string
	sourcemaps?: boolean
	proxy?: Record<string, HttpProxy.ServerOptions>
}

export default class Server {
	private options: Options
	constructor(options: Options) {
		this.options = options
	}
	public start(port: number) {
		const app = Express()
		const httpServer = Http.createServer(app)
		// Setup proxy
		for (const key in this.options.proxy) {
			app.use(key, createProxyMiddleware(this.options.proxy[key]))
		}
		const middleWare = new MiddleWare({
			path: this.options.path,
			compilerOptions: {
				inlineSourceMap: this.options.sourcemaps,
			},
		})
		// Handle watch
		if (this.options.watch) {
			const webSocketServer = new WebSocket.Server({ server: httpServer })
			const watchMiddleware = new WatchMiddleware({
				path: this.options.path,
				resolveJsFile: middleWare.resolveFilePath.bind(middleWare),
				onChange: (filePath: string) => {
					// eslint-disable-next-line no-console
					console.log('File changed:', Path.relative('.', filePath))
					webSocketServer.clients.forEach((client) => {
						client.send('reload')
					})
				},
			})
			app.use(watchMiddleware.onRequest.bind(watchMiddleware))
		}
		app.use(middleWare.onRequest.bind(middleWare))
		app.use(Express.static(this.options.path))
		app.use(ServeIndex(this.options.path))
		// Start the Express-server
		httpServer.listen(port, () => {
			// eslint-disable-next-line no-console
			console.log(`serve directory ${this.options.path} using port ${port}`)
		})
	}
}
