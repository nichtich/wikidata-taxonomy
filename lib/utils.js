module.exports = {
  pushArrayField: (obj, field, value) => {
    obj[field] = obj[field] || []
    obj[field].push(value)
  },
  traverseGraph: (graph, callback) => {
    const concepts = graph.concepts || []
    const visited = []

    const deepFirst = (uri, depth, isSubjectOf) => {
      const concept = concepts[uri]
      if (!concept) return

      callback(concept, depth, visited[uri], isSubjectOf)

      if (!visited[uri]) {
        visited[uri] = true

        const subjectOf = concept.subjectOf || []
        // TODO: subjectOf should be stored in the node!
        subjectOf.forEach(child => deepFirst(child.uri, depth + 1, true))

        const narrower = concept.narrower || []
        narrower.forEach(child => deepFirst(child.uri, depth + 1, false))
      }
    }

    const topConcepts = graph.topConcepts || []
    topConcepts.forEach(c => deepFirst(c.uri, 0, false))
  }
}
