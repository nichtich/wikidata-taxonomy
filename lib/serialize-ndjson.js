module.exports = (graph, stream) => {
  (graph.topConcepts || []).forEach(concept => {
    stream.write(serializeNDJSON(graph, concept.uri))
  })
}

function serializeNDJSON (graph, id) {
  const concept = graph.concepts[id]
  if (!concept || concept.visited) return
  concept.visited = true

  return [JSON.stringify(concept)].concat(
    (concept.subjectOf || [])
      .map(item => serializeNDJSON(graph, item.uri))
  ).concat(
    (concept.narrower || [])
      .map(item => serializeNDJSON(graph, item.uri))
  ).filter(v => v).join('\n')
}
