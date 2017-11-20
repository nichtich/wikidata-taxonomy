const { traverseGraph } = require('./utils')

module.exports = (graph, stream) => {
  traverseGraph(graph, (node, depth, visited) => {
    if (!visited) stream.write(JSON.stringify(node) + '\n')
  })
}
