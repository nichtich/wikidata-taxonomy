const { getPrefLabel, getOccurrenceCount } = require('./jskos')

module.exports = (node, depth, visited, isSubjectOf, options, separator, esc) => {
  const col = options.chalk
  const delimiter = col.delimiter

  var label = getPrefLabel(node, options.languages[0])
  if (esc) label = esc(label)

  var csv = ''
  if (!depth) {
    var header = ['level', 'id', 'label']

    if (options.sitecount) header.push('sites')
    if (options.instancecount) header.push('instances')

    header.push('parents')
    csv += header.join(delimiter(',')) + '\n'
  }

  var row = [
    delimiter((node.visited ? '=' : '-').repeat(depth)),
    col.green(options.uris ? node.uri : node.notation[0]),
    isSubjectOf ? col.cyan(label) : col.white(label)
  ]

  if (options.sitecount) {
    row.push(col.yellow(getOccurrenceCount(node.occurrences, {relation: 'http://schema.org/about'})))
  }
  if (options.instancecount) {
    row.push(col.cyan(getOccurrenceCount(node.occurrences, {relation: 'http://www.wikidata.org/entity/P31'})))
  }

  const broaderCount = node.broader ? node.broader.length : 0
  const parents = broaderCount ? '^'.repeat(broaderCount - (!depth ? 0 : 1)) : ''
  row.push(col.red(parents))

  csv += row.join(delimiter(separator)) + '\n'

  return csv
}
