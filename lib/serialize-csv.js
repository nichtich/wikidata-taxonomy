module.exports = (graph, stream) => {
  stream.write(serializeCSV(graph, graph.root))
}

function serializeCSV (graph, id, depth=0) {
  const node = graph.items[id]
  if (!node) return ''

  const label = node.label.replace(',', ' ') // for CSV

  var csv = ''
  if (!depth) {
    csv += 'level,id,label,'
    if (graph.sites) csv += 'sites,'
    if (graph.instances) csv += 'instances,'
    csv += 'parents\n'
  }

  var row = [
    (node.visited ? '=' : '-').repeat(depth + 1),
    id,
    label
  ]
  if (graph.sites) row.push(node.sites)
  if (graph.instances) row.push(node.instances)
  row.push('^'.repeat(node.otherparents + 1))
  csv += row.join(',') + '\n'

  if (!node.visited) {
    node.visited = true
    var narrower = node.narrower || []
    narrower.forEach((child) => {
      csv += serializeCSV(graph, child, depth + 1)
    })
  }

  return csv
}
