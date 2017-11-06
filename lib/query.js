const request = require('request-promise-native')
const { simplifySparqlResults } = require('wikidata-sdk')
const sparqlQueries = require('./sparql')
const options = require('./options')
const { pushArrayField } = require('./utils')

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
        if (item.item.label === id && !item.broader && !item.instances && !item.sites) {
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
  var concepts = {}

  // class hierarchy
  results[0].forEach((row) => {
    const uri = 'http://www.wikidata.org/entity/' + row.item.value

    if (!concepts[uri]) {
      const item = itemFromRow(row, env.language)

      item.instances = row.instances
      item.sites = row.sites

      if (row.mappings) {
        item.identifier = row.mappings.split('\t')
      }

      concepts[uri] = item
    }

    if (row.broader) {
      pushArrayField(
        concepts[uri], 'broader',
        {uri: 'http://www.wikidata.org/entity/' + row.broader}
      )
    }
  })

  // add narrower from broader
  for (let uri in concepts) {
    const item = concepts[uri]
    ;(item.broader || []).forEach(c => {
      if (concepts[c.uri]) {
        pushArrayField(concepts[c.uri], 'narrower', {uri: uri})
      }
    })
  }

  // add instances
  if (results[1]) {
    results[1].forEach((row) => {
      const classId = 'http://www.wikidata.org/entity/' + row.class.value
      const itemId = row.item.value

      const item = itemFromRow(row, env.language)

      if (!concepts[item.uri]) {
        concepts[item.uri] = item
      }

      if (concepts[classId]) {
        pushArrayField(concepts[classId], 'subjectOf', {uri: 'http://www.wikidata.org/entity/' + itemId})
      }
    })
  }

  // sort linked concepts by Q/P-ID
  for (let uri in concepts) {
    const item = concepts[uri]
    for (let field of ['narrower', 'broader', 'subjectOf']) {
      if (item[field]) {
        item[field] = item[field].sort(
          (a, b) => a.uri.substr(a.uri.lastIndexOf('/') + 2) - b.uri.substr(b.uri.lastIndexOf('/') + 2)
        )
      }
    }
  }

  if (env.reverse) {
    Object.keys(concepts).map(uri => concepts[uri]).forEach(item => {
      [item.broader, item.narrower] = [item.narrower, item.broader]
    })
  }

  return { // as JSKOS Concept Scheme
    type: ['http://www.w3.org/2004/02/skos/core#ConceptScheme'],
    modified: (new Date()).toISOString(),
    license: [{
      uri: 'http://creativecommons.org/publicdomain/zero/1.0/',
      notation: ['CC0']
    }],
    languages: [env.language],
    topConcepts: [{uri: 'http://www.wikidata.org/entity/' + root}],
    concepts: concepts,

    // FIXME: these fields are not JSKOS
    sites: !env.brief,
    instances: !env.brief
  }
}
