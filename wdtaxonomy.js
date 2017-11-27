#!/usr/bin/env node

const program = require('./lib/program')
const { normalizeId } = require('wikidata-sdk')
const { queryTaxonomy, serializeTaxonomy, sparqlQueries } = require('./index.js')

program
  .version(require('./package.json').version)
  .arguments('<id>')
  .option('-b, --brief', 'omit counting instances and sites')
  .option('-c, --children', 'get direct subclasses only')
  .option('-d, --descr', 'include item descriptions')
  .option('-e, --sparql-endpoint <url>', 'customize the SPARQL endpoint') // same in wikidata-cli
  .option('-i, --instances', 'include instances')
  .option('-I, --no-instancecount', 'omit counting instances')
  .option('-l, --lang <lang>', 'specify the language to use') // same as wikidata-cli
  .option('-L, --no-labels', 'omit all labels')
  .option('-m, --mappings <ids>', 'mapping properties (e.g. P1709)')
  .option('-P, --property <id>', 'hierarchy property (e.g. P279)')
  .option('-p, --post', 'use HTTP POST to disable caching')
  .option('-r, --reverse', 'get superclasses instead')
  .option('-S, --no-sitecount', 'omit counting sites')
  .option('-t, --total', 'count total number of instances')
  .option('-u, --user <name>', 'user to the SPARQL endpoint')
  .option('-U, --uris', 'show full URIs in output formats')
  .option('-w, --password <string>', 'password to the SPARQL endpoint')
  .description('extract taxonomies from Wikidata')

program.run({
  formats: ['txt', 'csv', 'json', 'ndjson'],
  serializer: serializeTaxonomy,
  action: function (wid, env, error) {
    wid = wid.replace(/^.*[^0-9A-Z]([QP][0-9]+)([^0-9].*)?$/i, '$1')

    if (env.brief) {
      env.instancecount = false
      env.sitecount = false
    }

    try {
      var id = normalizeId(wid)
    } catch (err) {
      error(1, 'invalid id: %s', wid)
    }

    const serializeOptions = {
      chalk: env.chalk,
      uris: env.uris,
      instancecount: env.instancecount,
      sitecount: env.sitecount
    }

    env.property = env.property || ''
    var match = env.property.match(/^([pP]?([0-9]+))?([/,][pP]?([0-9]+))?/)
    if (match) {
      var qid = id.substr(0, 1) === 'Q'
      env.property = [
        'P' + (match[2] || (qid ? '279' : '1647')),
        'P' + (match[4] || '31') // TODO: default value for properties (?)
      ]
    } else {
      error(1, 'property must be specified like P279 or P279,P31')
    }

    if (env.sparql) {
      var queries = sparqlQueries(id, env)
      env.out().write(queries.join('\n') + '\n')
    } else {
      queryTaxonomy(id, env)
        .then(taxonomy => {
          env.serialize(taxonomy, env.out(), serializeOptions)
        })
        .catch(e => {
          error(2, env.verbose && e.stack ? e.stack : e.message)
        })
    }
  }
})
