module.exports = (opt) => {
  opt = opt || {}
  opt.language = opt.language || 'en'
  opt.property = opt.property || ['P279', 'P31']
  opt.endpoint = opt.endpoint || 'https://query.wikidata.org/sparql'

  return opt
}
