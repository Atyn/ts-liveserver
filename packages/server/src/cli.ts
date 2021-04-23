#!/usr/bin/env node

import ArgParser from './ArgParser'
import Server from './Server'
import HttpProxy from 'http-proxy'

const argParser = new ArgParser(Array.from(process.argv))
const server = new Server({
	path: argParser.getPath() || process.cwd(),
	watch: argParser.shouldUseWatch(),
	sourcemaps: argParser.shouldUseSourceMaps(),
	proxy: getHttpProxy(),
})
server.start(8080)

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})

function getHttpProxy(): Record<string, HttpProxy.ServerOptions> {
	const proxy: Record<string, HttpProxy.ServerOptions> = {}
	const proxyUrls = argParser.getProxyRules().map((str) => new URL(str))
	for (const url of proxyUrls) {
		proxy[url.pathname] = {
			target: url.origin + '/',
			changeOrigin: true,
			autoRewrite: true,
		}
	}
	return proxy
}
