const serializeSV = require('./serialize-sv')
const { traverseConcepts } = require('./jskos')

const rfc4180escape = (s) => s.match(/[",\n\r]/)
  ? '"' + s.replace('"', '""') + '"' : s

module.exports = (scheme, stream, options) => {
  options.languages = scheme.languages
  traverseConcepts(
    scheme,
    (...args) => stream.write(serializeSV(...args, options, ',', rfc4180escape))
  )
}
