#! /usr/bin/env node

'use strict'

const { pinoToEcs } = require('../lib')

/* istanbul ignore next */
if (require.main === module) {
  pinoToEcs()
}
