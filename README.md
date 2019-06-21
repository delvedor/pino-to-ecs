# pino-to-ecs

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/delvedor/pino-to-ecs.svg?branch=master)](https://travis-ci.org/delvedor/pino-to-ecs)  [![codecov](https://codecov.io/gh/delvedor/pino-to-ecs/branch/master/graph/badge.svg)](https://codecov.io/gh/delvedor/pino-to-ecs)

Converts [Pino](http://getpino.io) logs to [Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/ecs-reference.html).<br/>
It pairs well with Pino and [Filebeat](https://www.elastic.co/products/beats/filebeat), while [pino-elasticsearch](https://github.com/pinojs/pino-elasticsearch) integrates this module.

## Install
```
npm i pino-to-ecs
```

## Usage
This module can be used in two ways, from the cli or programmatically.<br/>
You can play with this module with the files in the `examples` folder.

### CLI Usage
```
node app.js | pino-to-ecs
```

```js
// app.js
'use strict'

var pino = require('pino')()
pino.info('hello world')
```

### API
```js
'use strict'

const toEcs = require('pino-to-ecs')

const logs = [ ... ] // array of Pino logs
const ecs = logs.map(toEcs)

console.log(ecs)
```

You can also easily use it inside a Transform stream:
```js
'use strict'

const { Transform } = require('readable-stream')
const toEcs = require('pino-to-ecs')

const transform = new Transform({
  objectMode: true,
  transform: function (chunk, encoding, callback) {
    callback(null, toEcs(chunk))
  }
})
```

Or use directly the cli utility to handle streams:
```js
'use strict'

const { Writable, Duplex } = require('readable-stream')
const { pinoToEcs } = require('pino-to-ecs')

const stdin = new Duplex({ ... })
const stdout = new Writable({ ... })
pinoToEcs(stdin, stdout)

const pino = Pino(stdin)
pino.info('hello world')
```

## License
**[Apache-2.0](h./LICENSE)**

Copyright © 2019 Tomas Della Vedova
