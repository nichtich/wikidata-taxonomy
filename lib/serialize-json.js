module.exports = (graph, stream) => {
  stream.write(JSON.stringify(graph, null, 2) + '\n')
}
