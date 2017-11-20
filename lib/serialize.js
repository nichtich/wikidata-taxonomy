module.exports = ['json', 'ndjson', 'csv', 'text']
  .reduce((map, format) => {
    map[format] = require('./serialize-' + format)
    return map
  }, {})

// alias
module.exports.tree = module.exports.text
