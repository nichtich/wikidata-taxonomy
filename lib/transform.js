const { pushArrayField } = require('./utils')
const { equivalentTypes } = require('./mappings')

module.exports = {
  itemFromRow: (row, language) => {
    const item = {
      uri: 'http://www.wikidata.org/entity/' + row.item.value,
      notation: [row.item.value]
    }

    if (row.item.label && row.item.label !== row.item.value) {
      item.prefLabel = { [language]: row.item.label }
    }

    if (row.itemDescription) {
      item.scopeNote = { [language]: [row.itemDescription] }
    }

    return item
  },
  addMapping: (concept, mapping, property) => {
    if (!mapping) {
      return
    }

    pushArrayField(
      concept, 'mappings', {
        from: { memberSet: [{uri: concept.uri}] },
        // FIXME: mapping may have other datatype but URI
        to: { memberSet: [{uri: mapping}] },
        type: equivalentTypes(property)
      })
  }
}
