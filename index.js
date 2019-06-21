#! /usr/bin/env node

'use strict'

const stringify = require('fast-safe-stringify')
const { Transform, pipeline } = require('readable-stream')
const split = require('split2')

/* istanbul ignore next */
function splitter (line) {
  try {
    line = JSON.parse(line)
  } catch (err) {
    this.emit('unknown', line, err)
    return
  }

  if (typeof line === 'boolean') {
    this.emit('unknown', line, 'Boolean value ignored')
    return
  }

  if (line === null) {
    this.emit('unknown', line, 'Null value ignored')
    return
  }

  if (typeof line !== 'object') {
    line = { data: line }
  }

  return line
}

function pinoToEcs (input = process.stdin, output = process.stdout) {
  const transform = new Transform({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      const log = stringify(toEcs(chunk)) + '\n'
      callback(null, log)
    }
  })

  pipeline(
    input,
    split(splitter),
    transform,
    output
  )
}

function toEcs (chunk) {
  const {
    err,
    time,
    msg,
    level,
    hostname,
    pid,
    req,
    res,
    reqId,
    responseTime,
    // there is no need to keep this field
    v,
    ...log
  } = chunk

  log.ecs = { version: '1.0.0' }

  if (err) {
    log.error = log.error || {}
    log.error.code = err.type
    log.error.message = err.message
    // `error.stack` is not standardized
    log.error.stack = err.stack
  }

  if (reqId) {
    log.event = log.event || {}
    log.event.id = reqId
  }

  if (responseTime) {
    log.event = log.event || {}
    log.event.duration = responseTime * 1e6
  }

  if (time) {
    log['@timestamp'] = time
  }

  if (msg) {
    log.message = msg
  }

  if (level) {
    log.log = {}
    log.log.level = level
  }

  if (hostname) {
    log.host = log.host || {}
    log.host.hostname = hostname
  }

  if (pid) {
    log.process = log.process || {}
    log.process.pid = pid
  }

  if (req) {
    const {
      id,
      method,
      url,
      remoteAddress,
      remotePort,
      headers,
      ...filteredReq
    } = req

    if (id) {
      log.event = log.event || {}
      log.event.id = id
    }

    log.http = log.http || {}
    log.http.request = log.http.request || {}
    log.http.request.method = method

    log.url = log.url || {}
    log.url.path = url

    log.client = log.client || {}
    log.client.address = remoteAddress
    log.client.port = remotePort

    if (headers) {
      if (headers['user-agent']) {
        log.user_agent = log.user_agent || {}
        log.user_agent.original = headers['user-agent']
        delete headers['user-agent']
      }
      if (headers['content-length']) {
        log.http.request.body = log.http.request.body || {}
        log.http.request.body.bytes = Number(headers['content-length'])
        delete headers['content-length']
      }

      if (Object.keys(headers).length) {
        // `http.request.headers` is not standardized
        log.http.request.headers = headers
      }
    }

    if (Object.keys(filteredReq).length) {
      log.req = filteredReq
    }
  }

  if (res) {
    const { statusCode, headers, ...filteredRes } = res
    log.http = log.http || {}
    log.http.response = log.http.response || {}
    log.http.response.status_code = statusCode

    if (headers) {
      if (headers['content-length']) {
        log.http.response.body = log.http.response.body || {}
        log.http.response.body.bytes = Number(headers['content-length'])
        delete headers['content-length']
      }

      if (Object.keys(headers).length) {
        // `http.response.headers` is not standardized
        log.http.response.headers = headers
      }
    }

    if (headers && Object.keys(filteredRes).length) {
      log.res = filteredRes
    }
  }

  return log
}

/* istanbul ignore next */
if (require.main === module) {
  pinoToEcs()
}

module.exports = toEcs
module.exports.pinoToEcs = pinoToEcs
