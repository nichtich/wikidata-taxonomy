const chalk = require('chalk')

module.exports = (graph, stream, options) => {
  // FIXME: disabling chalk for browserify could be simpler
  var col = options.colors ? chalk : null
  if (!col) {
    col = {};
    ['dim', 'cyan', 'green', 'yellow', 'red'].forEach(
      (name) => {
        col[name] = s => s
      }
    )
  }
  stream.write(serializeTree(graph, graph.root, '', col))
}

function serializeTree (graph, id, depth, col) {
  var node = graph.items[id]
  if (!node) return ''

  var label = node.label === '' ? '???' : node.label
  var sites = graph.sites && node.sites ? ' •' + node.sites : ''
  var instances = node.instances ? ' ×' + node.instances : ''
  if (graph.instances && Object.keys(graph.instances).length) {
    instances = ''
  }
  var parents = node.otherparents
                ? ' ' + Array(node.otherparents + 1).join('↑') : ''
  var narrower = node.narrower || []
  var etc = node.visited + narrower.length ? ' …'
                : (node.multi > 1 ? '=' : '') // TODO: set multihierarchy

  // check whether item is an instance at level 0
  var color = (id.substr(0, 1) === 'Q' && !depth && !node.instances &&
               !node.otherparents && !narrower.length)
            ? 'cyan' : 'white'

  var string = col[color](label) +
             col.dim(' (') + col.green(id) + col.dim(')') +
             col.yellow(sites) + col.cyan(instances) +
             col.red(parents + etc)

  if (node.identifier) {
    string += col.dim(" = ") + col.green(node.identifier.join(" "))
  }

  string += '\n'

  if (node.visited) return string
  node.visited = true

  if (node.description) {
    string += depth
    if (narrower.length) string += '│ '
    string += node.description + '\n'
  }

  if (graph.instances) {
    const instanceList = graph.instances[id] || []

    for (let i = 0; i < instanceList.length; i++) {
      const item = graph.items[ instanceList[i] ]

      const label = item.label === '' ? '???' : item.label
      const id = item.notation[0]
      const prefix = narrower.length ? '|' : ' '

      string += col.dim(depth + prefix) +
             col.dim(item.visited ? '=' : '-') +
             col.cyan(label) +
             col.dim(' (') + col.green(id) + col.dim(')') +
             '\n'

      if (item.description) {
        string += prefix + ' ' + item.description + '\n'
      }

      item.visited = true
    }
  }

  for (let i = 0; i < narrower.length; i++) {
    const cur = narrower[i]
    var last = (i === narrower.length - 1)
    if (!graph.items[cur]) continue
    const prefix = graph.items[cur].visited
      ? (last ? '╘══' : '╞══')
      : (last ? '└──' : '├──')
    string += col.dim(depth + prefix)
    string += serializeTree(graph, cur, depth + (last ? '   ' : '│  '), col)
  }

  return string
}
