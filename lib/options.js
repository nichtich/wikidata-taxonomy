const { shortcuts } = require('./mappings')

// Validate and complement options passed to the query function
module.exports = (opt) => {
  opt = opt || {}
  opt.language = opt.language || 'en'
  opt.property = opt.property || ['P279', 'P31']
  opt.endpoint = opt.endpoint || 'https://query.wikidata.org/sparql'

  if (opt.instances) {
    opt.instancecount = false
  }

  if (opt.instances && opt.reverse) {
    throw new Error('option instances and reverse cannot be specified together')
  }

  if (opt.mappings in shortcuts) {
    opt.mappings = shortcuts[opt.mappings]
  }

  if (typeof opt.mappings === 'string') {
    opt.mappings = opt.mappings.split(',')
  }

  if (opt.mappings && !opt.mappings.length) {
    opt.mappings = null
  }

  return opt
}
