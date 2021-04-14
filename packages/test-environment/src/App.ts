import AnotherModule from './AnotherModule'
import { getSomething } from './AsyncLoad'
import AInterface from './AInterface'
document.body.innerHTML = AnotherModule

import React from 'react'
import ReactDOM from 'react-dom'
import Component from './Component'
import Data from './DataFile.json'

// eslint-disable-next-line no-console
console.log('Data:', Data)

getSomething().then((result) => {
	// eslint-disable-next-line no-console
	console.log('result:', result)
})

const element = document.createElement('div')
ReactDOM.render(React.createElement(Component, {}), element)

document.body.appendChild(element)

export default null
