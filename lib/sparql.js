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

  const items = 'SELECT DISTINCT ?item { ' +
              (env.reverse
                  ? 'wd:' + root + ' wdt:' + property[0] + path + ' ?item'
                  : '?item wdt:' + property[0] + path + ' wd:' + root) +
              ' }'

  var vars = '?item ?itemLabel ?broader'

  if (env.description) {
    vars += ' ?itemDescription'
  }

  var sparql = `
    OPTIONAL { ?item wdt:${property[0]} ?broader } .`

  var details = []

  if (env.instancecount) {
    var total = env.total ? '/wdt:' + property[0] + '*' : ''
    vars += ' ?instances'
    details.push(`
      SELECT ?item (count(distinct ?element) as ?instances) {
        INCLUDE %items.
        OPTIONAL { ?element wdt:${property[1]}${total} ?item }
      } GROUP BY ?item`
    )
  }

  if (env.sitecount) {
    vars += ' ?sites'
    details.push(`
      SELECT ?item (count(distinct ?site) as ?sites) {
        INCLUDE %items.
        OPTIONAL { ?site schema:about ?item }
      } GROUP BY ?item`
    )
  }

  if (env.mappings) {
    vars += ' ?mapping ?mappingProperty'
    details.push(mappingsQuery(env.mappings))
  }

  sparql += details.map(s => '\n    {' + s + '\n    }').join('')

  return sparqlItemsQuery(vars, items, sparql, env.language)
}

function sparqlItemsQuery (vars, selectItems, where, language) {
  if (language) {
    where += `
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "${language}"
    }`
  }

  return `  SELECT ${vars} WITH {
    ${selectItems}
  } AS %items WHERE { 
    INCLUDE %items .${where}
  }`
}

function mappingsQuery (mappings) {
  mappings = mappings.map(
    (p) => '{ ?item wdt:' + p + " ?mapping . BIND('" + p + "' AS ?mappingProperty) }"
  ).join(' UNION\n          ')
  return `
      SELECT ?item ?mapping ?mappingProperty {
        INCLUDE %items .
        OPTIONAL {
          ${mappings}
        }
      }`
}

// SPARQL query to get all instances
function instancesQuery (root, env) {
  var vars = '?class ?classLabel ?item ?itemLabel'

  if (env.description) vars += ' ?itemDescription'

  var sparql = ''
  if (env.mappings) {
    vars += ' ?mapping ?mappingProperty'
    sparql += '\n    { ' + mappingsQuery(env.mappings) + '\n    }'
  }

  var items = `SELECT ?class ?item {
      ?class wdt:${env.property[0]}* wd:${root} .
      ?item wdt:${env.property[1]} ?class .
    }`

  return sparqlItemsQuery(vars, items, sparql, env.language)
}
