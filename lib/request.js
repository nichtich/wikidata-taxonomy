const request = require('request-promise-native')

function queryVia$ (sparql, env) {
  var settings = {
    url: env.endpoint,
    method: env.post ? 'POST' : 'GET',
    data: { format: 'json', query: sparql }
  }

  if (env.user || env.password) {
    if (env.user) settings.username = env.user
    if (env.password) settings.password = env.password
  }

  return Promise.resolve($.ajax(settings)) // eslint-disable-line
}

function queryViaRequest (sparql, env) {
  var options = {
    uri: env.endpoint,
    method: env.post ? 'POST' : 'GET',
    qs: { // query string
      format: 'json',
      query: sparql
    }
  }
  // HTTP Authentication
  if (env.user || env.password) {
    options.auth = {}
    if (env.user) options.auth.user = env.user
    if (env.password) options.auth.password = env.password
  }

  return request(options)
}

// promise-request-native or $.ajax
module.exports = typeof (request) === 'function' ? queryViaRequest : queryVia$
