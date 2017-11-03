module.exports = (graph, stream) => {
  stream.write(serializeNDJSON(graph, graph.root))
}

function serializeNDJSON (graph, id) {
  const node = graph.items[id]
  if (!node || node.visited) return ''
  node.visited = true

  var lang = graph.language // TODO: valid language tags?

  // serialize current node to JSKOS
  var concept = {
    notation: node.notation,
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
  /* if ('label' in node) {
    if (node.label !== '') { // TODO: explicit negation?
      concept.prefLabel = {}
      concept.prefLabel[lang] = node.label
    }
  } */
  if (node.description) {
    concept.scopeNote = {}
    concept.scopeNote[lang] = [node.description]
  }
  if ('identifier' in node) {
    concept.identifier = node.identifier
  }

  return JSON.stringify(concept) + '\n' +
    (node.narrower || [])
      .map(id => serializeNDJSON(graph, id)).join('')
}
