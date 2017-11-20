#!/usr/bin/env node

const program = require('commander')
const { normalizeId } = require('wikidata-sdk')
const { queryTaxonomy, serializeTaxonomy, sparqlQueries } = require('./index.js')

var chalk = require('chalk')

// print error and exit
function error (code) {
  const args = [].slice.call(arguments, 1)
  args[0] = chalk.red(args[0])
  console.error.apply(null, args)
  process.exit(code)
}

program
  .version(require('./package.json').version)
  .arguments('<id>')
  .option('-b, --brief', 'omit counting instances and sites')
  .option('-c, --children', 'get direct subclasses only')
  .option('-C, --color', 'enforce color output')
  .option('-d, --descr', 'include item descriptions')
  .option('-e, --sparql-endpoint <url>', 'customize the SPARQL endpoint') // same in wikidata-cli
  .option('-f, --format <text|csv|json|ndjson>', 'output format')
  .option('-i, --instances', 'include instances')
  .option('-I, --no-instancecount', 'omit counting instances')
  .option('-j, --json', 'use JSON output format') // same as wikidata-cli
  .option('-l, --lang <lang>', 'specify the language to use') // same as wikidata-cli
  .option('-L, --no-labels', 'omit all labels')
  .option('-m, --mappings <ids>', 'mapping properties (e.g. P1709)')
  .option('-n, --no-colors', 'disable color output')
  .option('-o, --output <file>', 'write result to a file')
  .option('-P, --property <id>', 'hierarchy property (e.g. P279)')
  .option('-p, --post', 'use HTTP POST to disable caching')
  .option('-r, --reverse', 'get superclasses instead')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-S, --no-sitecount', 'omit counting sites')
  .option('-t, --total', 'count total number of instances')
  .option('-u, --user <name>', 'user to the SPARQL endpoint')
  .option('-U, --uris', 'show full URIs in output formats')
  .option('-v, --verbose', 'make the output more verbose') // same in wikidata-cli
  .option('-w, --password <string>', 'password to the SPARQL endpoint')
  .description('extract taxonomies from Wikidata')
  .action(function (wid, env) {
    if (env.output === '-') {
      env.output = undefined
    }

    chalk = env.color || (env.colors && chalk.enabled && env.output === undefined)
          ? chalk : require('./lib/nochalk.js')

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

    var out = process.stdout

    if (env.json) env.format = 'json'

    if (env.output) {
      var ext = env.output.split('.').pop()
      if (!env.format && ['csv', 'json', 'ndjson'].indexOf(ext) >= 0) {
        env.format = ext
      }
    }

    const serializeOptions = {
      chalk: chalk,
      uris: env.uris,
      instancecount: env.instancecount,
      sitecount: env.sitecount
    }

    env.description = env.descr
    const format = env.format || 'tree'

    if (!format.match(/^(tree|csv|json|ndjson)$/)) {
      error(1, 'unsupported format: %s', format)
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

    out = function (file) {
      if (!file) return process.stdout
      var stream = require('fs').createWriteStream(file)
      stream.on('error', function (err) { error(2, err) })
      return stream
    }

    if (env.sparql) {
      var queries = sparqlQueries(id, env)
      out(env.output).write(queries.join('\n') + '\n')
    } else {
      queryTaxonomy(id, env)
        .then(taxonomy => {
          const serialize = serializeTaxonomy[format] || serializeTaxonomy.text
          serialize(taxonomy, out(env.output), serializeOptions)
        })
        .catch(e => {
          error(2, env.verbose && e.stack ? e.stack : e.message)
        })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}
