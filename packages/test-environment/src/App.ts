import AnotherModule from './AnotherModule'
import { getSomething } from './AsyncLoad'
document.body.innerHTML = AnotherModule

import React from 'react'
import ReactDOM from 'react-dom'
import Component from './Component'

getSomething().then((result) => {
	console.log('result:', result)
})

ReactDOM.render(React.createElement(Component, {}), document.body)
