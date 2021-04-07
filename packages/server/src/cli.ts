#!/usr/bin/env node

import Express from 'express'
import MiddleWare from '@ts-liveserver/express-middleware'
import ServeIndex from 'serve-index'

const argArray = Array.from(process.argv)
const path = argArray.find((name) => name.startsWith('.')) || process.cwd()
const options = {
	watch: argArray.some((arg) => arg.startsWith('--watch')),
}

const middleWare = new MiddleWare(path, options)
const app = Express()
const port = 8080

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(
		`serve directory ${path} using port ${port} with options ${JSON.stringify(
			options,
		)}`,
	)
})

app.use(middleWare.onRequest.bind(middleWare))
app.use(Express.static(path))
app.use(ServeIndex(path))

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})
