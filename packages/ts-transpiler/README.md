# About

A compiler build upon the TypeScript compiler

## Features

- TypeScript
- Transpile TSX & JSX
- JSON
- CommonJS
- Sourcemaps for .ts, tsx and .jsx files

## Note about internal NodeJS modules

If one of your dependencies are using internal NodeJS-module, you need to add a conterpart that works in browser that will be resolved by the server. Simply add some of the dependencies to your project in order for this to work:

```json
{
	"dependencies": {
		"events": "^3.3.0",
		"stream": "^0.0.2",
		"buffer": "^6.0.3",
		"util": "^0.12.3",
		"browserify-zlib": "^0.2.0",
		"assert": "^2.0.0"
	}
}
```
