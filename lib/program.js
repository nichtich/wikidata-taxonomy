const program = require('commander')

var chalk = require('chalk')

program.run = (config) => {
  var { argv, formats, serializer, action } = config

  if (!argv) argv = process.argv

  // add common options
  program
    .option('-C, --color', 'enforce color output')
    .option('-f, --format <' + formats.join('|') + '>', 'output format')
    .option('-j, --json', 'use JSON output format') // same as wikidata-cli
    .option('-n, --no-colors', 'disable color output')
    .option('-o, --output <file>', 'write result to a file')
    .option('-s, --sparql', 'print SPARQL query and exit')
    .option('-v, --verbose', 'make the output more verbose') // same in wikidata-cli

  // execute
  program.action((args, env) => {
    // process common options
    chalk = env.color || (env.colors && chalk.enabled && env.output === undefined)
          ? chalk : require('./nochalk.js')
    env.chalk = chalk

    const error = function (code) {
      const args = [].slice.call(arguments, 1)
      args[0] = chalk.red(args[0])

      // TODO: if env.verbose && e.stack ? e.stack : e.message)
      console.error.apply(null, args)

      process.exit(code)
    }

    if ('descr' in program.opts()) {
      env.description = env.descr
    }

    if (env.output === '-') {
      env.output = undefined
    }

    if (env.json) env.format = 'json'

    if (env.output) {
      var ext = env.output.split('.').pop()
      if (!env.format && formats.indexOf(ext) >= 0) {
        env.format = ext
      }
    }

    env.serialize = serializer[env.format || 'txt']
    if (!env.serialize) {
      error(1, 'unsupported format: %s', env.format)
    }

    var stream
    env.out = function () {
      if (!env.output) return process.stdout
      if (!stream) {
        stream = require('fs').createWriteStream(env.output)
        stream.on('error', function (err) { error(2, err) })
      }
      return stream
    }

    // exectue specific action
    action(args, env, error)
  })
  .parse(argv)

  // print help by default
  if (!program.args.length) {
    program.help()
  }
}

module.exports = program
