import AnotherModule from './AnotherModule'
document.body.innerHTML = AnotherModule

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Component from './Component'

ReactDOM.render(React.createElement(Component, {}), document.body)
