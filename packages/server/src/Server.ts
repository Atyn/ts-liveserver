import HttpProxy from 'http-proxy'
import Express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import MiddleWare from '@ts-liveserver/express-middleware'
import ServeIndex from 'serve-index'

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
		const middleWare = new MiddleWare({
			path: this.options.path,
			compilerOptions: {
				inlineSourceMap: this.options.sourcemaps,
			},
			watchCallback: this.options.watch
				? (filePath: string) => console.log(filePath)
				: undefined,
		})
		const app = Express()
		for (const key in this.options.proxy) {
			app.use(key, createProxyMiddleware(this.options.proxy[key]))
		}
		app.use(middleWare.onRequest.bind(middleWare))
		app.use(Express.static(this.options.path))
		app.use(ServeIndex(this.options.path))
		app.listen(port, () => {
			// eslint-disable-next-line no-console
			console.log(`serve directory ${this.options.path} using port ${port}`)
		})
	}
}
