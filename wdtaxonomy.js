#!/usr/bin/env node

// dependencies
var chalk	= require('chalk')
var program = require('commander')
var Promise = require('bluebird')
var wdt = require('./lib/wikidata-taxonomy.js')

// print error and exit
function error(code) {
  args = [].slice.call(arguments,1)
  args[0] = chalk.red(args[0])
  console.error.apply(null, args)
  process.exit(code)
}

program
  .version('0.2.6')
  .arguments('<id>')
  .option('-l, --language [code]', 'language to get labels in')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-f, --format [tree|csv|json]', 'output format')
  .option('-i, --instances', 'include instances (only in tree format)')
  .option('-n, --no-colors', 'disable color output')
  .option('-r, --reverse', 'get superclasses instead of subclasses')
  .option('-o, --output [file]', 'write result to a file')
  .description('extract taxonomies from Wikidata')
  .action(function(wid, env) {
    if (!env.colors) {
      chalk = new chalk.constructor({enabled: false});
    }
    var id = wdt.normalizeId(wid)
    if (id === undefined) {
      error(1,"invalid id: %s", wid)
    }
    if (id.substr(0,1) == 'P') {
      env.properties = true
    }

    var out = process.stdout
    if (env.output) {
      var ext = env.output.split('.').pop()
      if (!env.format && (ext == 'csv' || ext == 'json')) {
        env.format = ext
      }
    }

    env.language = env.language || 'en' // TOOD: get from POSIX?
    format       = env.format || 'tree'

    if (!format.match(/^(tree|csv|json)$/)) {
      error(1,"unsupported format: %s", format)
    }

    if (env.instances && env.reverse) {
      error(1,"option instances and reverse cannot be specified together");
    }

    var out = function(file) {
      if (!file) return process.stdout
      var stream = require('fs').createWriteStream(file)
      stream.on('error', function(err) { error(2,err) })
      return stream
    }

    var queries = wdt.sparql.queries(id, env)
       
    if (env.sparql) {
      out(env.output).write(queries.join("\n"))
    } else {
      Promise.all( queries.map(wdt.query) )
        .catch((err) => {
          error(2,"SPARQL request failed!")
        })
        // TODO: check if only one result and test for existence/type
        .then((results) => {
          graph = wdt.build(id, results, env.reverse)
          out(env.output).write(wdt.serialize(graph, format))
        })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}

