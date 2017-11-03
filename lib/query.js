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
  try {
    env = options(env)
  } catch (e) {
    return Promise.reject(e)
  }

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

function itemFromRow (row, language) {
  const item = {
    uri: 'http://www.wikidata.org/entity/' + row.item.value,
    notation: [row.item.value]
  }

  if (row.item.label && row.item.label !== row.item.value) {
    item.prefLabel = { [language]: row.item.label }
  }

  if (row.itemDescription) {
    item.scopeNote = { [language]: row.itemDescription }
  }

  return item
}

// Build graph data from root item and SPARQL results
function buildTaxonomy (root, results, env) {
  const language = env.language

  var items = {}
  var narrower = {}
  var broader = {}

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
      const item = itemFromRow(row, language)

      item.parents = row.parents
      item.instances = row.instances
      item.sites = row.sites

      if (row.mappings) {
        item.identifier = row.mappings.split('\t')
      }
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

  // add instances
  if (results[1]) {
    results[1].forEach((row) => {
      const classId = row.class.value
      const itemId = row.item.value

      const item = itemFromRow(row, language)

      if (!items[itemId]) {
        items[itemId] = item
      }

      if (items[classId]) {
        items[classId].subjectOf = items[classId].subjectOf || []
        // items[classId].subjectOf.push({uri: 'http://www.wikidata.org/entity/' + itemId})
        items[classId].subjectOf.push(itemId)
      }
    })

    // TODO: sort instances
    /*
    for (let id in instances) {
      instances[id] = instances[id].sort(
        (x, y) => x.substr(1) - y.substr(1)
      )
    }
    */
  }

  // TODO: don't reverse in JSKOS format
  if (env.reverse) {
    [narrower, broader] = [broader, narrower]
  }

  var graph = {
    items: items,
    narrower: narrower,
    broader: broader,
    root: root,
    language: env.language,
    sites: !env.brief
  }

  // move narrower/broader to nodes
  ;['narrower', 'broader'].forEach((dir) => {
    for (let id in graph[dir]) {
      if (!items[id]) {
        items[id] = { notation: [id] }
      }
      items[id][dir] = graph[dir][id]
    }
    delete graph[dir]
  })

  return graph
}
