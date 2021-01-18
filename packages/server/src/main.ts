#!/usr/bin/env node

import Express from 'express'
import MiddleWare from '@ts-liveserver/express-middleware'

const app = Express()
const port = 8080

app.listen(port, () => {
	console.log('Server listening for port', port)
})

app.use(MiddleWare)
app.use(Express.static('.'))
