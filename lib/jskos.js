// utility functions to process JSKOS data
module.exports = {

  getPrefLabel: (item, language = 'en', fallback = '') => {
    const prefLabel = item.prefLabel || {}

    language = selectLanguageFromMap(prefLabel, language)

    return language in prefLabel ? prefLabel[language] : fallback
  },

  getScopeNotes: (item, language = 'en') => getLanguageMapList(item, 'scopeNote', language),

  getOccurrenceCount: (occurrences, match) => {
    return ((occurrences || [])
          .find(o => {
            for (let f in match) {
              if (o[f] !== match[f]) return false
            }
            return true
          }) || {}).count || 0
  },

  // depth-first traverse all concepts in a concept scheme
  traverseConcepts: (scheme, callback) => {
    if (!scheme.concepts) return

    const concepts = setMap(scheme.concepts)
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

    const topConcepts = scheme.topConcepts || []
    topConcepts.forEach(c => deepFirst(c.uri, 0, false))
  },

  setMap: setMap
}

function setMap (set) {
  return set.reduce((map, c) => { map[c.uri] = c; return map }, {})
}

function selectLanguageFromMap (languageMap, language) {
  if (language in languageMap) {
    return language
  }

  // take the first if required language is not available
  for (let language in languageMap) {
    return language
  }

  return 'en'
}

function getLanguageMapList (item, field, language) {
  const languageMap = item[field] || {}
  language = selectLanguageFromMap(languageMap, language)
  return language in languageMap ? languageMap[language] : []
}
