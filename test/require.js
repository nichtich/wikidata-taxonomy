var expect = require('chai').expect;
var wdt    = require('../lib/wikidata-taxonomy.js')

describe('wikidata-taxonomy library', () => {
  it('should export serializers', () => {
    expect(wdt.serialize.csv).to.be.function  
    expect(wdt.serialize.json).to.be.function  
    expect(wdt.serialize.tree).to.be.function  
    expect(wdt.serialize.json).to.be.function  
    expect(wdt.serialize.ndjson).to.be.function  
  })
  it('should export query, taxonomy', () => {
    expect(wdt.query).to.be.function  
    expect(wdt.taxonomy).to.be.function  
  })
})
