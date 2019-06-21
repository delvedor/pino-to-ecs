'use strict'

const { test } = require('tap')
const Pino = require('pino')
const { Transform } = require('readable-stream')
const split = require('split2')
const toEcs = require('./index')
const { pinoToEcs } = toEcs

test('toEcs', t => {
  t.test('Should parse a basic log', t => {
    const incomingPost = {
      level: 30,
      time: 1561122678406,
      pid: 65354,
      hostname: 'Skadi.local',
      reqId: 1,
      req: {
        method: 'POST',
        url: '/body',
        headers: {
          host: 'localhost:3000',
          'user-agent': 'curl/7.54.0',
          accept: '*/*',
          'content-type': 'application/json',
          'content-length': '13'
        },
        hostname: 'localhost:3000',
        remoteAddress: '127.0.0.1',
        remotePort: 62061
      },
      msg: 'incoming request',
      v: 1
    }

    const log = toEcs(incomingPost)
    t.type(log, 'string')
    t.strictEqual(log.slice(-1), '\n')
    t.deepEqual(JSON.parse(log.slice(0, -1)), {
      ecs: { version: '1.0.0' },
      event: { id: 1 },
      '@timestamp': 1561122678406,
      message: 'incoming request',
      log: { level: 30 },
      host: { hostname: 'Skadi.local' },
      process: { pid: 65354 },
      http: {
        request: {
          method: 'POST',
          body: { bytes: 13 },
          headers: {
            host: 'localhost:3000',
            accept: '*/*',
            'content-type': 'application/json'
          }
        }
      },
      url: { path: '/body' },
      client: { address: '127.0.0.1', port: 62061 },
      user_agent: { original: 'curl/7.54.0' },
      req: { hostname: 'localhost:3000' }
    })
    t.end()
  })

  t.test('Should parse a basic error log', t => {
    const stack = 'Error: kaboom\n    at Object.fastify.get (/Users/delvedor/Development/pino-to-ecs/examples/fastify.js:42:9)\n    at preHandlerCallback (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/handleRequest.js:112:30)\n    at preValidationCallback (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/handleRequest.js:101:5)\n    at handler (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/handleRequest.js:70:5)\n    at handleRequest (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/handleRequest.js:19:5)\n    at onRunMiddlewares (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/middleware.js:22:5)\n    at middlewareCallback (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/route.js:354:5)\n    at next (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/hooks.js:66:7)\n    at handleResolve (/Users/delvedor/Development/pino-to-ecs/node_modules/fastify/lib/hooks.js:77:5)\n    at process._tickCallback (internal/process/next_tick.js:68:7)'

    const incomingError = {
      level: 50,
      time: 1561123426199,
      pid: 70256,
      hostname: 'Skadi.local',
      reqId: 1,
      req: {
        method: 'GET',
        url: '/error',
        headers: {
          host: 'localhost:3000',
          'user-agent': 'curl/7.54.0',
          accept: '*/*'
        },
        hostname: 'localhost:3000',
        remoteAddress: '127.0.0.1',
        remotePort: 62109
      },
      res: { statusCode: 500 },
      err: {
        type: 'Error',
        message: 'kaboom',
        stack
      },
      msg: 'kaboom',
      v: 1
    }

    const log = toEcs(incomingError)
    t.type(log, 'string')
    t.strictEqual(log.slice(-1), '\n')
    t.deepEqual(JSON.parse(log.slice(0, -1)), {
      ecs: { version: '1.0.0' },
      event: { id: 1 },
      error: {
        code: 'Error',
        message: 'kaboom',
        stack
      },
      '@timestamp': 1561123426199,
      message: 'kaboom',
      log: { level: 50 },
      host: { hostname: 'Skadi.local' },
      process: { pid: 70256 },
      http: {
        request: {
          method: 'GET',
          headers: {
            host: 'localhost:3000',
            accept: '*/*'
          }
        },
        response: {
          status_code: 500
        }
      },
      url: { path: '/error' },
      client: { address: '127.0.0.1', port: 62109 },
      user_agent: { original: 'curl/7.54.0' },
      req: { hostname: 'localhost:3000' }
    })
    t.end()
  })

  t.test('Response log', t => {
    const outgoingResponse = {
      level: 30,
      time: 1561124998358,
      pid: 73235,
      hostname: 'Skadi.local',
      req: {
        id: 1,
        method: 'GET',
        url: '/hello',
        headers: {
          host: 'localhost:3000',
          'user-agent': 'curl/7.54.0',
          accept: '*/*'
        },
        remoteAddress: '::1',
        remotePort: 62385
      },
      res: {
        statusCode: 200,
        headers: {
          'content-type': 'text/plain',
          'content-length': 12
        },
        other: true
      },
      responseTime: 5,
      msg: 'request completed',
      v: 1
    }

    const log = toEcs(outgoingResponse)
    t.type(log, 'string')
    t.strictEqual(log.slice(-1), '\n')
    t.deepEqual(JSON.parse(log.slice(0, -1)), {
      ecs: { version: '1.0.0' },
      event: {
        id: 1,
        duration: 5000000
      },
      '@timestamp': 1561124998358,
      message: 'request completed',
      log: { level: 30 },
      host: { hostname: 'Skadi.local' },
      process: { pid: 73235 },
      http: {
        request: {
          method: 'GET',
          headers: {
            host: 'localhost:3000',
            accept: '*/*'
          }
        },
        response: {
          status_code: 200,
          body: { bytes: 12 },
          headers: { 'content-type': 'text/plain' }
        }
      },
      url: { path: '/hello' },
      client: { address: '::1', port: 62385 },
      user_agent: { original: 'curl/7.54.0' },
      res: { other: true }
    })
    t.end()
  })

  t.end()
})

test('pinoToEcs', t => {
  t.test('Should parse a log stream', t => {
    t.plan(4)

    const stdin = new Transform({
      transform (chunk, encoding, callback) {
        callback(null, chunk)
      }
    })
    const stdout = split(line => JSON.parse(line))

    const pino = Pino(stdin)
    pinoToEcs(stdin, stdout)

    stdout.once('data', data => {
      t.type(data['@timestamp'], 'number')
      t.type(data.host.hostname, 'string')
      t.type(data.process.pid, 'number')
      t.match(data, {
        ecs: { version: '1.0.0' },
        message: 'hello world',
        log: { level: 30 }
      })
    })

    pino.info('hello world')
  })
  t.end()
})
