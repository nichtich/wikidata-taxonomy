const { traverseGraph } = require('./utils')

const serialize = module.exports = {

  json: (graph, stream) => {
    stream.write(JSON.stringify(graph, null, 2) + '\n')
  },

  ndjson: (graph, stream) => {
    traverseGraph(graph, (node, depth, visited) => {
      if (!visited) stream.write(JSON.stringify(node) + '\n')
    })
  },

  csv: require('./serialize-csv'),

  tree: require('./serialize-tree')
}

// aliases
serialize.text = serialize.text
