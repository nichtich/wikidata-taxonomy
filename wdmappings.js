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

const serializeMappings = {
  json: serializeJson,
  ndjson: (concordance, stream) => {
    concordance.mappings.forEach(mapping => {
      stream.write(JSON.stringify(mapping) + '\n')
    })
  },
  // BEACON link dump format
  txt: (concordance, stream, options) => {
    const lang = options.language
    const meta = {
      NAME: concordance.prefLabel.en,
      DESCRIPTION: concordance.scopeNote.en[0]
    }

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

    meta.SOURCESET = concordance.fromScheme.uri
    meta.TIMESTAMP = concordance.modified

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

    concordance.mappings.forEach(mapping => {
      const concept = mapping.from.memberSet[0]
      const id = options.uris ? concept.uri : concept.notation[0]
      const label = getPrefLabel(concept, lang, '')

      mapping.to.memberSet.forEach(targetConcept => {
        let target = targetConcept.uri
        let annotation = label

        if (!options.uris) {
          target = target.substr(options.namespace.length)
        }

        if (triples) {
          annotation = options.uris ? mapping.type[0] : mapping.type[0].split('#')[1]
        }

        writer.writeTokens(id, annotation, target)
      })
    })
  },
  // CSV format
  csv: (concordance, stream, options) => {
    const col = options.chalk

    var fields = ['source', 'label', 'type', 'target', 'property']
    stream.write(fields.join(col.dim(',')) + '\n')

    concordance.mappings.forEach(mapping => {
      const concept = mapping.from.memberSet[0]
      const id = options.uris ? concept.uri : concept.notation[0]
      const label = getPrefLabel(concept, options.language).replace(',', '')
      const types = mapping.type

      mapping.to.memberSet.forEach(targetConcept => {
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
    })
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

    var concordance = {
      mappings: []
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

          for (let uri in concepts) {
            let concept = concepts[uri]
            concept.mappings.forEach(mapping => {
              ['notation', 'prefLabel', 'scopeNote'].forEach(key => {
                if (key in concept) {
                  mapping.from.memberSet[0][key] = concept[key]
                }
              })
              concordance.mappings.push(mapping)
            })
          }

          concordance.fromScheme = {
            uri: 'http://www.wikidata.org/entity/Q2013',
            prefLabel: { en: 'Wikidata' },
            url: 'https://www.wikidata.org/'
          }
          concordance.prefLabel = {
            en: 'Wikidata ontology mappings'
          }
          concordance.scopeNote = {
            en: ['Mapping from Wikidata entities to external ontologies']
          }
          concordance.modified = (new Date()).toISOString()

          env.serialize(concordance, env.out(), serializeOptions)
        }
      ).catch(e => {
        console.error(env.verbose && e.stack ? e.stack : 'SPARQL request failed')
        process.exit(1)
      })
    }
  }
})
