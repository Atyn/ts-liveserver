#!/usr/bin/env node

import Express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import MiddleWare from '@ts-liveserver/express-middleware'
import ServeIndex from 'serve-index'
import ArgParser from './ArgParser'

const argParser = new ArgParser(Array.from(process.argv))
const options = {
	path: argParser.getPath() || process.cwd(),
	watchCallback: argParser.shouldUseWatch()
		? (filePath: string) => {
				// eslint-disable-next-line no-console
				console.log(filePath)
		  }
		: undefined,
	inlineSourceMap: argParser.shouldUseSourceMaps(),
}

const middleWare = new MiddleWare(options)
const app = Express()
const port = 8080

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(
		`serve directory ${
			options.path
		} using port ${port} with options ${JSON.stringify(options)}`,
	)
})

const proxyUrls = argParser.getProxyRules().map((str) => new URL(str))
for (const url of proxyUrls) {
	app.use(
		url.pathname,
		createProxyMiddleware({
			target: url.origin + '/',
			changeOrigin: true,
			autoRewrite: true,
		}),
	)
}

app.use(middleWare.onRequest.bind(middleWare))
app.use(Express.static(options.path))
app.use(ServeIndex(options.path))

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})
