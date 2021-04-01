#!/usr/bin/env node

import Express from 'express'
import MiddleWare from '@ts-liveserver/express-middleware'
import ServeIndex from 'serve-index'

const path = process.argv[2] || process.cwd()
const middleWare = new MiddleWare(path)
const app = Express()
const port = 8080

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log('Server listening for port', port)
})

app.use(middleWare.onRequest.bind(middleWare))
app.use(Express.static(path))
app.use(ServeIndex(path))

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})
