const { getPrefLabel, getOccurrenceCount } = require('./jskos')

module.exports = (graph, stream, options) => {
  (graph.topConcepts || []).forEach(concept => {
    stream.write(serializeCSV(graph, concept.uri, 0, options))
  })
}

function serializeCSV (graph, id, depth = 0, options) {
  const node = graph.concepts[id]
  if (!node) return ''

  const col = options.chalk

  // remove commas in label for CSV output
  const label = getPrefLabel(node, graph.languages[0]).replace(',', '')

  var csv = ''
  if (!depth) {
    depth = 0
    var header = ['level', 'id', 'label']

    if (options.sitecount) header.push('sites')
    if (options.instancecount) header.push('instances')

    header.push('parents')
    csv += header.join(col.dim(',')) + '\n'
  }

  var row = [
    col.dim((node.visited ? '=' : '-').repeat(depth)),
    col.green(options.uris ? id : node.notation[0]),
    col.white(label) // TODO: cyan for instances
  ]

  if (options.sitecount) {
    row.push(col.yellow(getOccurrenceCount(node.occurrences, {relation: 'http://schema.org/about'})))
  }
  if (options.instancecount) {
    row.push(col.cyan(getOccurrenceCount(node.occurrences, {relation: 'http://www.wikidata.org/entity/P31'})))
  }

  var isRoot = id === graph.topConcepts[0].uri
  const parents = '^'.repeat((node.broader || []).length - (isRoot ? 0 : 1))
  row.push(col.red(parents))
  csv += row.join(col.dim(',')) + '\n'

  // TODO: include instances

  if (!node.visited) {
    node.visited = true
    var narrower = node.narrower || []
    narrower.forEach((child) => {
      csv += serializeCSV(graph, child.uri, depth + 1, options)
    })
  }

  return csv
}
