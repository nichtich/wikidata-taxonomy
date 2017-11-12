const { getPrefLabel } = require('./jskos')

module.exports = (graph, stream, options) => {
  (graph.topConcepts || []).forEach(concept => {
    stream.write(serializeCSV(graph, concept.uri, 0, options))
  })
}

function serializeCSV (graph, id, depth = 0, options) {
  const node = graph.concepts[id]
  if (!node) return ''

  // remove commas in label for CSV output
  const label = getPrefLabel(node, graph.languages[0]).replace(',', '')

  var csv = ''
  if (!depth) {
    depth = 0
    csv += 'level,id,label,'
    if (graph.sites) csv += 'sites,'
    if (graph.instances) csv += 'instances,'
    csv += 'parents\n'
  }

  var row = [
    (node.visited ? '=' : '-').repeat(depth),
    options.uris ? id : node.notation[0],
    label
  ]
  if (graph.sites) row.push(node.sites)
  if (graph.instances) row.push(node.instances)

  var isRoot = id === graph.topConcepts[0].uri
  row.push('^'.repeat((node.broader || []).length - (isRoot ? 0 : 1)))
  csv += row.join(',') + '\n'

  if (!node.visited) {
    node.visited = true
    var narrower = node.narrower || []
    narrower.forEach((child) => {
      csv += serializeCSV(graph, child.uri, depth + 1, options)
    })
  }

  return csv
}
