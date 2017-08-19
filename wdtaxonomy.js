#!/usr/bin/env node

// dependencies
var chalk	= require('chalk')
var program = require('commander')
var wdt = require('./lib/wikidata-taxonomy.js')

// print error and exit
function error(code) {
  args = [].slice.call(arguments,1)
  args[0] = chalk.red(args[0])
  console.error.apply(null, args)
  process.exit(code)
}

program
  .version(require('./package.json').version)
  .arguments('<id>')
  .option('-b, --brief', 'don\'t count instance and sites')
  .option('-c, --children', 'get direct subclasses only')
  .option('-d, --descr', 'include item descriptions')
  .option('-f, --format <tree|csv|json|ndjson>', 'output format')
  .option('-i, --instances', 'include instances (tree format)')
  .option('-l, --language <code>', 'language to get labels in')
  .option('-n, --no-colors', 'disable color output')
  .option('-o, --output <file>', 'write result to a file')
  .option('-P, --property <id>', 'hierarchy property (e.g. P279)')
  .option('-p, --post', 'use HTTP POST to disable caching')
  .option('-r, --reverse', 'get superclasses instead')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-t, --total', 'count total number of instances')
  .option('-v, --verbose', 'show verbose error messages')
  .description('extract taxonomies from Wikidata')
  .action(function(wid, env) {
    if (!env.colors) {
      chalk = new chalk.constructor({enabled: false});
    }

    wid = wid.replace(/^.*[^0-9A-Z]([QP][0-9]+)([^0-9].*)?$/i,'$1');
    var id = wdt.normalizeId(wid)
    if (id === undefined) {
      error(1,"invalid id: %s", wid)
    }

    var out = process.stdout
    if (env.output) {
      var ext = env.output.split('.').pop()
      if (!env.format && ['csv','json','ndjson'].indexOf(ext) >= 0) {
        env.format = ext
      }
    }

    env.description = env.descr
    env.language = env.language || 'en' // TOOD: get from POSIX?
    format       = env.format || 'tree'

    if (!format.match(/^(tree|csv|json|ndjson)$/)) {
      error(1,"unsupported format: %s", format)
    }

    if (env.instances && env.reverse) {
      error(1,"option instances and reverse cannot be specified together");
    }

    env.property = env.property || ''
    var match = env.property.match(/^([pP]?([0-9]+))?(\/[pP]?([0-9]+))?/);
    if (match) {
        var qid = id.substr(0,1) == 'Q'
        env.property = [
            'P' + (match[2] || (qid ? '279' : '1647')),
            'P' + (match[4] || '31') // TODO: default value for properties (?)
        ]
    } else {
        error(1,"property must be specified like P279 or P279/P31");
    }

    var out = function(file) {
      if (!file) return process.stdout
      var stream = require('fs').createWriteStream(file)
      stream.on('error', function(err) { error(2,err) })
      return stream
    }

    if (env.sparql) {
      var queries = wdt.sparql.queries(id,env)
      out(env.output).write(queries.join("\n")+"\n")
    } else {
      wdt.taxonomy(id,env)
        .then( taxonomy => {
          out(env.output).write(wdt.serialize(taxonomy, format))
        })
        .catch( e => {
          error(2, env.verbose && e.stack ? e.stack : e.message);
        })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}

