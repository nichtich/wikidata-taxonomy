var expect = require('chai').expect;
var wdt    = require('../lib/wikidata-taxonomy.js')

describe('wikidata-taxonomy library', () => {
  it('should export serializers', () => {
    expect(wdt.serializer.csv).to.be.function  
    expect(wdt.serializer.json).to.be.function  
    expect(wdt.serializer.tree).to.be.function  
  })
  it('should export serialize', () => {
    expect(wdt.serialize).to.be.function  
  })
})
