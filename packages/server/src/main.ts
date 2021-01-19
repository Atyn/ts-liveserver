#!/usr/bin/env node

import Express from 'express'
import MiddleWare from '@ts-liveserver/express-middleware'

const path = process.argv[2]
const middleWare = new MiddleWare(path)
const app = Express()
const port = 8080

app.listen(port, () => {
	console.log('Server listening for port', port)
})

app.use(middleWare.onRequest)
app.use(Express.static(path))
