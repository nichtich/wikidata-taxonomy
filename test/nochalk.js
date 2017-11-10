const expect = require('chai').expect
const nochalk = require('../lib/nochalk.js')
const colors = ['dim', 'cyan', 'green', 'yellow', 'red', 'white']

describe('nochalk', () => {
  it('should provide identity functions', () => {
    const value = Math.random().toString(36)
    colors.forEach(
      color => { expect(nochalk[color](value)).to.equal(value) }
    )
  })
})
