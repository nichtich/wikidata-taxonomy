const serializeSV = require('./serialize-sv')
const { traverseConcepts } = require('./jskos')

module.exports = (scheme, stream, options) => {
  options.languages = scheme.languages
  traverseConcepts(
    scheme,
    (...args) => stream.write(serializeSV(...args, options, '\t'))
  )
}
