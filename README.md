A superfast HTTP-server that compiles just-in-time to ES6 modules that browser can execute. Starts to serve your TypeScript project within a second!

## Features

- TypeScript
- Transpile TSX & JSX
- JSON
- CommonJS
- Sourcemaps for .ts, tsx and .jsx files

## Start server

```bash
npx @ts-liveserver/server
```

## Note about internal NodeJS modules

If one of your dependencies are using internal NodeJS-module, you need to add a conterpart that works in browser that will be resolved by the server. Simply add some of the dependencies to your project in order for this to work:

```json
{
	"dependencies" {
    "events": "^3.3.0",
		"stream": "^0.0.2",
		"buffer": "^6.0.3",
		"util": "^0.12.3",
		"browserify-zlib": "^0.2.0",
		"assert": "^2.0.0"
	}
}
```

## Open web browser

```html
<head></head>
<body></body>
<script type="module">
	import './App.js'
</script>
```

## How does it work?

I handles request using ExpressJS and respond with a transpiled results from TypeScript compiler

## Upcoming features

- Building to deployment
- Watch and auto-refresh
- Reducing import forwards (no unnecessary index.js calls)
- TypeScript diagnostic reporting in terminal
