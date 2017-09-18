const request = require('request-promise')
const wdk = require('wikidata-sdk')
const Promise = require('bluebird')

const wdt = module.exports = {
  sparql: {},
  serialize: require('./serialize')
}

// promise a taxonomy extracted from Wikidata
wdt.taxonomy = (id, env) => {
  var queries = wdt.sparql.queries(id, env)

  var executeQuery = function (sparql) {
    var options = {
      uri: env.endpoint,
      qs: {
        format: 'json',
        query: sparql
      }
    }
    if (env.post) options.method = 'POST'
    if (env.user || env.password) {
      options.auth = {}
      if (env.user) options.auth.user = env.user
      if (env.password) options.auth.password = env.password
    }
    return request(options).then(wdk.simplifySparqlResults)
  }

  return Promise.all(queries.map(executeQuery))
    .catch(e => {
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
              return r.length ? wdt.build(id, results, env) : null
            })
        }
      }
      return wdt.build(id, results, env)
    })
    .then(taxonomy => {
      if (!taxonomy) throw new Error(id + ' not found')
      return taxonomy
    })
}

// normalize Wikidata identifier and return string or undefined
wdt.normalizeId = (id) => {
  try {
    return wdk.normalizeId(id)
  } catch (err) {

  }
}

// get list of SPARQL queries to build the taxonomy
wdt.sparql.queries = (id, env) => {
  var queries = [ wdt.sparql.hierarchy(id, env) ]
  if (env.instances) {
    queries.push(wdt.sparql.instances(id, env))
  }
  return queries
}

// construct basic SPARQL query
wdt.sparql.hierarchy = (root, env) => {
  const property = env.property
  const path = env.children ? '?' : '*'
  const reachable = env.reverse
                     ? 'wd:' + root + ' wdt:' + property[0] + path + ' ?item'
                     : '?item wdt:' + property[0] + path + ' wd:' + root

  var vars = '?item ?itemLabel ?broader ?parents'

  if (env.description) {
    vars += ' ?itemDescription'
  }

  var sparql = `WHERE {
    {
        SELECT ?item (count(distinct ?parent) as ?parents) {
            ${reachable}
            OPTIONAL { ?item wdt:${property[0]} ?parent }
        } GROUP BY ?item
    }
`
  if (!env.brief) {
    var total = env.total ? '/wdt:' + property[0] + '*' : ''
    vars += ' ?instances'
    sparql += `    {
        SELECT ?item (count(distinct ?element) as ?instances) {
            ${reachable}
            OPTIONAL { ?element wdt:${property[1]}${total} ?item }
        } GROUP BY ?item
    }
`
    if (!env.brief) {
      vars += ' ?sites'
      sparql += `    {
        SELECT ?item (count(distinct ?site) as ?sites) {
            ${reachable}
            OPTIONAL { ?site schema:about ?item }
        } GROUP BY ?item
    }
`
    }
  }

  sparql += `    OPTIONAL { ?item wdt:${property[0]} ?broader }
    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${env.language}" .
    }
}`
  sparql = 'SELECT ' + vars + '\n' + sparql
  return sparql
}

// SPARQL query to get all instances
wdt.sparql.instances = (root, env) => {
  var vars = '?class ?classLabel ?instance ?instanceLabel'
  if (env.description) vars += ' ?instanceDescription'
  return `SELECT ${vars} WHERE {
    ?class wdt:${env.property[0]}* wd:${root} .
    ?instance wdt:${env.property[1]} ?class .
    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${env.language}" .
    }
}`
}

// Build graph data from root item and SPARQL results
wdt.build = (root, results, env) => {
  var graph = buildTree(results[0])
  var reverse = env.reverse
  var instances = {}

  graph.root = root
  graph.language = env.language

  if (results[1]) {
    var items = graph.items
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
      instances[id] = instances[id].sort((x, y) => {
        return items[x].value.substr(1) - items[y].value.substr(1)
      })
    }
    graph.instances = instances
  }

  // TODO: also reverse in JSKOS format?
  if (reverse) {
    var tmp = graph.narrower
    graph.narrower = graph.broader
    graph.broader = tmp
  }

  // move narrower/broader to nodes
  ['narrower', 'broader'].forEach(dir => {
    for (let id in graph[dir]) {
      if (!graph.items[id]) {
        graph.items[id] = { value: id }
      }
      graph.items[id][dir] = graph[dir][id]
    }
    delete graph[dir]
  })

  if (!env.brief) {
    graph.sites = true
    graph.instances = instances
  }

  return graph
}

// build tree structure from results (only called internally)
function buildTree (results) {
  var items = {}
  var narrower = {}
  var broader = {}

  results.forEach((row) => {
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
    narrower[id] = narrower[id].sort((x, y) => {
      return x.substr(1) - y.substr(1)
    })
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

  return { items: items, narrower: narrower, broader: broader }
}
