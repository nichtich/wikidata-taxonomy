const request = require('request-promise-native')
const { simplifySparqlResults } = require('wikidata-sdk')
const sparqlQueries = require('./sparql')
const options = require('./options')

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

// promise a taxonomy extracted from Wikidata
module.exports = (id, env) => {
  env = options(env)

  const queries = sparqlQueries(id, env)

  // promise-request-native or $.ajax
  const executeQuery = typeof (request) === 'function' ? queryViaRequest : queryVia$

  // use browserify-shim instead?
  const simplify = simplifySparqlResults || wdk.simplifySparqlResults // eslint-disable-line

  return Promise.all(queries.map(
      sparql => executeQuery(sparql, env).then(simplify)
    )).catch(e => {
      throw new Error('SPARQL request failed')
    })
    .then(results => {
      if (results[0].length === 1 && (!results[1] || !results[1].length)) {
        var item = results[0][0]
        if (item.item.label === id && !item.parents && !item.instances && !item.sites) {
          // check whether lonely item/probably actually exists
          return executeQuery('SELECT * WHERE { wd:' + id + ' ?p ?v } LIMIT 1')
            .catch(e => {
              throw new Error('SPARQL request failed')
            })
            .then(r => {
              return r.length ? buildTaxonomy(id, results, env) : null
            })
        }
      }
      return buildTaxonomy(id, results, env)
    })
    .then(taxonomy => {
      if (!taxonomy) throw new Error(id + ' not found')
      return taxonomy
    })
}

// Build graph data from root item and SPARQL results
function buildTaxonomy (root, results, env) {
  var items = {}
  var narrower = {}
  var broader = {}
  var instances = {}

  results[0].forEach((row) => {
    var qid = row.item.value
    var broaderId = row.broader

    if (broaderId) {
      if (narrower[broaderId]) {
        narrower[broaderId].push(qid)
      } else {
        narrower[broaderId] = [qid]
      }
    }

    if (!items[qid]) {
      const item = {
        value: qid,
        label: row.item.label || '',
        parents: row.parents,
        instances: row.instances,
        sites: row.sites
      }
      if (row.itemDescription) {
        item.description = row.itemDescription
      }
      if (item.label === row.item.value) item.label = ''
      items[qid] = item
    }
  })

  for (let id in narrower) {
    // sort child nodes by Wikidata id
    narrower[id] = narrower[id].sort(
      (x, y) => x.substr(1) - y.substr(1)
    )
    // add reverse
    narrower[id].forEach(b => {
      if (!broader[b]) broader[b] = []
      broader[b].push(id)
    })
  }

  for (let id in items) {
    const item = items[id]
    item.otherparents = item.parents
    if (broader[id]) {
      broader[id].forEach((node) => {
        if (items[node]) item.otherparents--
      })
    }
  }

  if (results[1]) {
    results[1].forEach((row) => {
      var id = row.class.value
      if (!instances[id]) instances[id] = []
      if (!items[row.instance.value]) {
        items[row.instance.value] = row.instance
      }
      if (row.instanceDescription) {
        row.instance.description = row.instanceDescription
      }
      instances[id].push(row.instance.value)
    })

    for (let id in instances) {
      instances[id] = instances[id].sort(
        (x, y) => items[x].value.substr(1) - items[y].value.substr(1)
      )
    }
  }

  // TODO: don't reverse in JSKOS format
  if (env.reverse) {
    [narrower, broader] = [broader, narrower]
  }

  var graph = {
    items: items,
    narrower: narrower,
    broader: broader,
    instances: instances,
    root: root,
    language: env.language,
    sites: !env.brief
  }

  // move narrower/broader to nodes
  ;['narrower', 'broader'].forEach((dir) => {
    for (let id in graph[dir]) {
      if (!items[id]) {
        items[id] = { value: id }
      }
      items[id][dir] = graph[dir][id]
    }
    delete graph[dir]
  })

  return graph
}
