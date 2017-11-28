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

    if (!concept.mappings) concept.mappings = []

    if (!concept.mappings.find(m =>
        m.to.memberSet[0].uri === mapping &&
        m.type[m.type.length - 1] === 'http://www.wikidata.org/entity/' + property
    )) {
      concept.mappings.push({
        from: { memberSet: [{uri: concept.uri}] },
        // FIXME: mapping may have other datatype but URI
        to: { memberSet: [{uri: mapping}] },
        type: equivalentTypes(property)
      })
    }
  }
}
