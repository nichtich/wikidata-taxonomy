module.exports = (graph, stream) => {
  stream.write(serializeNDJSON(graph, graph.root))
}

function serializeNDJSON (graph, id) {
  const node = graph.items[id]
  if (!node || node.visited) return ''
  node.visited = true

  var concept = (
    ({uri, notation, identifier, prefLabel, scopeNote}) =>
    ({uri, notation, identifier, prefLabel, scopeNote}))(node)

  // TODO: sites/instances => subjectOf or extent
  if (node.parents > 0) {
    if (node.broader) {
      concept.broader = node.broader.map((id) => {
        return { uri: 'http://www.wikidata.org/entity/' + id }
      })
      // TODO: add 'null' for other parents and root
    } else {
      concept.broader = [null]
    }
  }
  if (node.narrower) {
    concept.narrower = node.narrower.map((id) => {
      return { uri: 'http://www.wikidata.org/entity/' + id }
    })
      // TODO: add 'null' for omitted narrower
  }

  // TODO: include instances

  return JSON.stringify(concept) + '\n' +
    (node.narrower || [])
      .map(id => serializeNDJSON(graph, id)).join('')
}
