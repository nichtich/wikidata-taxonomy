#!/usr/bin/env node

const program = require('./lib/program')
const options = require('./lib/options')
const executeQuery = require('./lib/request')
const { simplifySparqlResults } = require('wikidata-sdk')
const { itemFromRow, addMapping } = require('./lib/transform')
const { getPrefLabel } = require('./lib/jskos')
const serializeJson = require('./lib/serialize-json')
const { mappingChars } = require('./lib/mappings')
const beacon = require('beacon-links')

/**
 * Usage examples:
 *
 * $ wdmappings http://purl.org/dc/terms/
 * $ wdmappings -m P1628 http://purl.org/dc/terms/
 */

function sparqlQuery (baseurl, env) {
  var vars = ['item']

  vars.push('mapping', 'mappingProperty')

  if (env.labels !== false) {
    vars.push('itemLabel')
    if (env.description) vars.push('itemDescription')
  }

  var query = 'SELECT ' + vars.map(v => '?' + v).join(' ') + ' WHERE {\n'
  query += env.mappings.map(
    (p) => '  { ?item wdt:' + p + " ?mapping . BIND('" + p + "' AS ?mappingProperty) }"
  ).join(' UNION\n') + '\n'

  query += `  FILTER(STRSTARTS(STR(?mapping), "${baseurl}"))`

  if (env.labels) {
    query += `
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "${env.language}"
    }`
  }

  query += '\n}'

  return query
}

function traverseMappings (graph, callback) {
  for (let uri in graph.concepts) {
    let concept = graph.concepts[uri]
    concept.mappings.forEach(mapping => {
      callback(mapping, concept)
    })
  }
}

const serializeMappings = {
  json: serializeJson,
  ndjson: (graph, stream) => {
    traverseMappings(graph, mapping => {
      stream.write(JSON.stringify(mapping) + '\n')
    })
  },
  // BEACON link dump format
  txt: (graph, stream, options) => {
    const lang = options.language
    const meta = {}

    if (!options.uris) {
      meta.PREFIX = 'http://www.wikidata.org/entity/'
      meta.TARGET = options.namespace
    }

    var triples = false
    if (options.mappings.length === 1) {
      meta.RELATION = 'http://www.wikidata.org/entity/' + options.mappings[0]
    } else {
      meta.RELATION = options.uris ? '{+ID}' : 'http://www.w3.org/2004/02/skos/core#{+ID}'
      triples = true
    }

    const writer = beacon.Writer(stream, {
      highlight: {
        field: options.chalk.bold,
        delimiter: options.chalk.dim,
        source: options.chalk.green,
        annotation: options.chalk[triples ? 'cyan' : 'white'],
        target: options.chalk.yellow
      }
    })

    writer.writeMeta(beacon.MetaFields(meta))

    for (let uri in graph.concepts) {
      const concept = graph.concepts[uri]
      const id = options.uris ? concept.uri : concept.notation[0]
      const label = getPrefLabel(concept, lang, '')

      concept.mappings.forEach(mapping => {
        let target = mapping.to.memberSet[0].uri
        let annotation = label

        if (!options.uris) {
          target = target.substr(options.namespace.length)
        }

        if (triples) {
          annotation = options.uris ? mapping.type[0] : mapping.type[0].split('#')[1]
        }

        writer.writeTokens(id, annotation, target)
      })
    }
  },
  csv: (graph, stream, options) => {
    const col = options.chalk

    var fields = ['id', 'label', 'to']
    stream.write(fields.join(col.dim(',')) + '\n')

    for (let uri in graph.concepts) {
      const concept = graph.concepts[uri]
      const id = options.uris ? concept.uri : concept.notation[0]
      const label = getPrefLabel(concept, options.language).replace(',', '')

      concept.mappings.forEach(mapping => {
        const types = mapping.type

        var fields = [col.green(id), col.white(label)] // TODO: description
        var to = mapping.to.memberSet[0].uri
        if (!options.uris) {
          to = to.substr(options.namespace.length)
        }
        fields.push(col.cyan(options.uris ? types[0] : mappingChars[types[0]]))
        fields.push(col.yellow(to))

        let entity = types[types.length - 1]
        fields.push(options.uris ? entity : entity.split(/\//)[4])

        stream.write(fields.join(col.dim(',')) + '\n')
      })
    }
  }
}

program
  .arguments('<baseurl>')
  .option('-d, --descr', 'include item descriptions')
  .option('-l, --lang <lang>', 'specify the language to use')
  .option('-L, --no-labels', 'omit all labels')
  .option('-m, --mappings <ids>', 'mapping properties (e.g. P1709)')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .description('extract ontology mappings from Wikidata')

program.run({
  formats: ['txt', 'json', 'ndjson', 'csv'],
  serializer: serializeMappings,
  action: function (baseurl, env) {
    env.mappings = env.mappings || 'all'
    env.description = env.descr

    env = options(env)

    const serializeOptions = {
      chalk: env.chalk,
      uris: env.uris,
      language: env.language,
      namespace: baseurl,
      mappings: env.mappings
    }

    let query = sparqlQuery(baseurl, env)
    if (env.sparql) {
      env.out().write(query + '\n')
    } else {
      executeQuery(query, env).then(simplifySparqlResults).then(
        results => {
          var concepts = {}

          results.forEach(row => {
            if (typeof row.item === 'string') {
              row.item = { value: row.item }
            }
            const concept = itemFromRow(row, env.language)
            const uri = concept.uri
            if (!concepts[uri]) concepts[uri] = concept

            addMapping(concepts[uri], row.mapping, row.mappingProperty)
          })

          env.serialize({ concepts: concepts }, env.out(), serializeOptions)
        }
      ).catch(e => {
        console.error(env.verbose && e.stack ? e.stack : 'SPARQL request failed')
        process.exit(1)
      })
    }
  }
})
