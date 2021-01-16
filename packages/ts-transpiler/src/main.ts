import Express from 'express'
import FileServer from './FileServer'
import Path from 'path'

const app = Express()
const port = 8080
const fileServer = new FileServer()
app.listen(port, () => {
	console.log('Server listening for port', port)
})

app.use(jsReturn)
app.use(Express.static('.'))

async function jsReturn(
	request: Express.Request,
	response: Express.Response,
	next: () => void,
) {
	switch (Path.extname(request.path)) {
		case '.tsx':
		case '.ts':
		case '.js':
		case '.jsx':
			response.set({ 'Content-Type': 'application/javascript' })
			response.send(await fileServer.getContent(request.path))
			break
		default:
			return next()
	}
}
