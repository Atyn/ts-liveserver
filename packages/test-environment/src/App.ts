import AnotherModule from './AnotherModule'
import { getSomething } from './AsyncLoad'
import AInterface from './AInterface'
document.body.innerHTML = AnotherModule

import React from 'react'
import ReactDOM from 'react-dom'
import Component from './Component'
import Data from './DataFile.json'
import Stream from 'stream'

console.log('Stream:', Stream)
console.log('Data:', Data)

getSomething().then((result) => {
	console.log('result:', result)
})

const element = document.createElement('div')
ReactDOM.render(React.createElement(Component, {}), element)

document.body.appendChild(element)

export default null
