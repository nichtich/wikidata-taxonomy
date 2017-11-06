module.exports = {
  pushArrayField: (obj, field, value) => {
    obj[field] = obj[field] || []
    obj[field].push(value)
  },
  getPrefLabel: (item, language = 'en', fallback = '') => {
    const prefLabel = item.prefLabel || {}

    // take just any label if required language not available
    if (!(language in prefLabel)) {
      for (language in prefLabel) {
        break
      }
    }

    return language in prefLabel ? prefLabel[language] : fallback
  }
}
