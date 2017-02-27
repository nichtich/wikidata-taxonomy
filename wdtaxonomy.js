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
  .option('-l, --language <code>', 'language to get labels in')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-f, --format <tree|csv|json>', 'output format')
  .option('-i, --instances', 'include instances (only in tree format)')
  .option('-b, --brief', 'don\'t count instance and sites')
  .option('-c, --children', 'get direct subclasses only')
  .option('-n, --no-colors', 'disable color output')
  .option('-p, --post', 'use HTTP POST to disable caching')
  .option('-r, --reverse', 'get superclasses instead of subclasses')
  .option('-o, --output <file>', 'write result to a file')
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
    var type = 'item';
    if (id.substr(0,1) == 'P') {
      type = 'property'
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

    if (env.sparql) {
      var queries = wdt.sparql.queries(id,env)
      out(env.output).write(queries.join("\n")+"\n")
    } else {
      wdt.taxonomy(id,env)
        .then( taxonomy => {
          out(env.output).write(wdt.serialize(taxonomy, format))
        })
        .catch( e => {
          error(2, e.message)
        })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}

