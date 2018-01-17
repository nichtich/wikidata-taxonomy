module.exports = {
  json: require('./serialize-json'),
  ndjson: require('./serialize-ndjson'),
  csv: require('./serialize-csv'),
  tsv: require('./serialize-tsv'),
  txt: require('./serialize-txt')
}

// alias
module.exports.tree = module.exports.text
