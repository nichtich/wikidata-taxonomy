module.exports = (graph, stream) => {
  stream.write(serializeNDJSON(graph, graph.root))
}

function serializeNDJSON (graph, id) {
  var nodes = []
  var lang = graph.language // TODO: valid language tags?
  for (let id in graph.items) {
    const node = graph.items[id]
    var concept = {
      notation: [id],
      uri: 'http://www.wikidata.org/entity/' + id
      // TODO: sites/instances => subjectOf or extent
    }
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
    if ('label' in node) {
      if (node.label !== '') { // TODO: explicit negation?
        concept.prefLabel = {}
        concept.prefLabel[lang] = node.label
      }
    }
    if (node.description) {
      concept.scopeNote = {}
      concept.scopeNote[lang] = [node.description]
    }
    nodes.push(JSON.stringify(concept))
  }
  return nodes.join('\n') + '\n'
}
