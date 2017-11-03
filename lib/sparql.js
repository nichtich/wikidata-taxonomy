const options = require('./options')

module.exports = (id, env) => {
  env = options(env)
  const queries = [ hierarchyQuery(id, env) ]
  if (env.instances) {
    queries.push(instancesQuery(id, env))
  }
  return queries
}

function hierarchyQuery (root, env = {}) {
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

  if (env.mappings) {
    var mappings = env.mappings.split(',').map(
      (p) => `{ ?item wdt:${p} ?mapping }`
    ).join(' UNION ')

    vars += ' ?mappings'
    sparql += `    {
        SELECT DISTINCT ?item (GROUP_CONCAT(?mapping;separator="\\t") as ?mappings) {
            ${reachable}
            OPTIONAL {
                ${mappings}
            }
        } GROUP BY ?item
    }
`
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
function instancesQuery (root, env) {
  var vars = '?class ?classLabel ?item ?itemLabel'
  if (env.description) vars += ' ?itemDescription'
  return `SELECT ${vars} WHERE {
    ?class wdt:${env.property[0]}* wd:${root} .
    ?item wdt:${env.property[1]} ?class .
    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${env.language}" .
    }
}`
}
