var expect = require('chai').expect;
var wdt    = require('../index.js')

describe('wikidata-taxonomy library', () => {
  it('should export serializers', () => {
    expect(wdt.serializeTaxonomy.csv).to.be.function  
    expect(wdt.serializeTaxonomy.json).to.be.function  
    expect(wdt.serializeTaxonomy.tree).to.be.function  
    expect(wdt.serializeTaxonomy.json).to.be.function  
    expect(wdt.serializeTaxonomy.ndjson).to.be.function  
  })
  it('should export query function', () => {
    expect(wdt.queryTaxonomy).to.be.function  
  })
})
