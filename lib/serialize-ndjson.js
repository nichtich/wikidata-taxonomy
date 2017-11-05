module.exports = (graph, stream) => {
  stream.write(serializeNDJSON(graph, graph.root))
}

function serializeNDJSON (graph, id) {
  const node = graph.items[id]
  if (!node || node.visited) return
  node.visited = true

  // TODO: include number of sites and number of instances
  const concept = (
    ({uri, notation, identifier, prefLabel, scopeNote, subjectOf, broader, narrower}) =>
    ({uri, notation, identifier, prefLabel, scopeNote, subjectOf, broader, narrower}))(node)

  return [JSON.stringify(concept)].concat(
    (node.subjectOf || [])
      .map(item => serializeNDJSON(graph, item.uri))
  ).concat(
    (node.narrower || [])
      .map(item => serializeNDJSON(graph, item.uri))
  ).filter(v => v).join('\n')
}
