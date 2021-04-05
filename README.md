A superfast HTTP-server that compiles just-in-time to ES6 modules that browser can execute. Starts to serve your TypeScript project within a second!

## Features

- TypeScript
- Convert TSX & JSX
- JSON
- CommonJS
- Sourcemaps for .ts, tsx and .jsx files

## Start server

```bash
npx @ts-liveserver/server
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

I handles request using Express and respond with a

## Upcoming features

- Building
- Watch
- Reducing import forwards (no unnecessary index.js calls)
- TypeScript diagnostic reporting in terminal
