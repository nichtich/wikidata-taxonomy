const serialize = module.exports = {
  json: (graph, stream) => {
    stream.write(JSON.stringify(graph, null, 2) + '\n')
  },
  ndjson: require('./serialize-ndjson'),
  csv: require('./serialize-csv'),
  text: require('./serialize-tree')
}

// aliases
serialize.tree = serialize.text
