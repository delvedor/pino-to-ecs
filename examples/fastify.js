'use strict'

const pino = require('pino')

const serializers = {
  req: function asReqValue (req) {
    return {
      method: req.method,
      url: req.url,
      headers: req.headers,
      version: req.headers['accept-version'],
      hostname: req.hostname,
      remoteAddress: req.ip,
      remotePort: req.connection.remotePort
    }
  },
  err: pino.stdSerializers.err,
  res: function asResValue (res) {
    return {
      statusCode: res.statusCode
    }
  }
}

const fastify = require('fastify')({ logger: { serializers } })

fastify.addHook('onRequest', async (req, reply) => {
  req.log.info('from onRequest hook', { url: req.raw.url })
})

fastify.addHook('preSerialization', async (req, reply, payload) => {
  req.log.info('from preSerialization hook', { payload })
})

fastify.get('/hello', async (req, reply) => {
  req.log.info('from hello route', { hello: 'world' })
  return { hello: 'world' }
})

fastify.get('/error', async (req, reply) => {
  req.log.info('from error route', { hello: 'error' })
  throw new Error('kaboom')
})

fastify.post('/body', async (req, reply) => {
  req.log.info('from body route', { body: req.body })
  return req.body
})

fastify.listen(3000, (err, address) => {
  if (err) throw err
  console.log(`Listening on ${address}...`)
})
