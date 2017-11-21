const { traverseConcepts } = require('./jskos')

module.exports = (scheme, stream) => {
  traverseConcepts(scheme, (node, depth, visited) => {
    if (!visited) stream.write(JSON.stringify(node) + '\n')
  })
}
