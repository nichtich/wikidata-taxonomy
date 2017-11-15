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
  }
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
