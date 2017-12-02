// utility functions to process JSKOS data
module.exports = {

  getPrefLabel: getPrefLabel,

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
  traverseConcepts: traverseConcepts,

  setMap: setMap,

  pruneHierarchy: pruneHierarchy
}

function getPrefLabel (item, language = 'en', fallback = '') {
  const prefLabel = item.prefLabel || {}

  language = selectLanguageFromMap(prefLabel, language)

  return language in prefLabel ? prefLabel[language] : fallback
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

function traverseConcepts (scheme, callback) {
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
}

const pruneChecks = {
  mappings: item => item.mappings && item.mappings.length,
  occurrences: item => item.occurrences && item.occurrences.length,
  instances: item => item.occurrences &&
    item.occurrences.some(o => o.relation === 'http://www.wikidata.org/entity/P31'),
  sites: item => item.occurrences &&
    item.occurrences.some(o => o.relation === 'http://schema.org/about')
}

function pruneHierarchy (scheme, prune) {
  const concepts = setMap(scheme.concepts)

  if (typeof prune !== 'function') {
    const checks = prune.split(',').map(p => {
      if (pruneChecks[p]) return pruneChecks[p]
      throw new Error("Don't know how to prune by " + p)
    })
    if (!checks.length) return
    prune = (item) => checks.some(c => c(item))
  }

  var keep = {}
  const topConcepts = scheme.topConcepts || []
  topConcepts.forEach(c => { keep[c.uri] = true })

  const keepBroader = (item) => {
    if (item && item.broader) {
      item.broader.forEach(b => {
        if (keep[b.uri]) return
        keep[b.uri] = true
        keepBroader(concepts[b.uri])
      })
    }
  }

  scheme.concepts.forEach(item => {
    if (!item || !item.uri || keep[item.uri]) return
    if (prune(item)) {
      keep[item.uri] = true
      keepBroader(item)
    }
  })

  // remove pruned items
  scheme.concepts = scheme.concepts.filter(c => {
    if (!keep[c.uri]) return
    if (c.narrower) c.narrower = c.narrower.filter(c => keep[c.uri])
    if (c.broader) c.broader = c.broader.filter(c => keep[c.uri])
    if (c.subjectOf) c.subjectOf = c.subjectOf.filter(c => keep[c.uri])
    return true
  })
}
