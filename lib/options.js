const mappingsShortcuts = {
  'equal': 'P1628,P1709,P2888',
  '=': 'P1628,P1709,P2888',
  'all': 'P1628,P1709,P2888,P2235,P2236,P3950',
  'narrower': 'P3950,P2236',
  'broader': 'P2235'
}

// Validate and complement options passed to the query function
module.exports = (opt) => {
  opt = opt || {}
  opt.language = opt.language || 'en'
  opt.property = opt.property || ['P279', 'P31']
  opt.endpoint = opt.endpoint || 'https://query.wikidata.org/sparql'

  if (opt.instances && opt.reverse) {
    throw new Error('option instances and reverse cannot be specified together')
  }

  if (opt.mappings in mappingsShortcuts) {
    opt.mappings = mappingsShortcuts[opt.mappings]
  }

  if (typeof opt.mappings === 'string') {
    opt.mappings = opt.mappings.split(',')
  }

  if (opt.mappings && !opt.mappings.length) {
    opt.mappings = null
  }

  return opt
}
