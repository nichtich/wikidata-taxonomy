const chalk = require('chalk')
const { getPrefLabel } = require('./utils')

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

  (graph.topConcepts || []).forEach(concept => {
    stream.write(serializeTree(graph, concept.uri, '', col))
  })
}

function serializeTree (graph, id, depth, col) {
  var node = graph.concepts[id]
  if (!node) return ''

  const label = getPrefLabel(node, graph.languages[0], '???')

  var sites = graph.sites && node.sites ? ' •' + node.sites : ''
  var instances = node.instances ? ' ×' + node.instances : ''
  if (node.subjectOf) {
    instances = ''
  }
  var parents = '↑'.repeat((node.broader || []).length - (id === graph.root ? 0 : 1))
  parents = parents ? ' ' + parents : ''

  var narrower = node.narrower || []
  var etc = node.visited + narrower.length ? ' …'
                : (node.multi > 1 ? '=' : '') // TODO: set multihierarchy

  // check whether item is an instance at level 0 (FIXME)
  var color = (id.substr(0, 1) === 'Q' && !depth && !node.instances &&
               node.broader.length <= 1 && !narrower.length)
            ? 'cyan' : 'white'

  var string = col[color](label) +
             col.dim(' (') + col.green(node.notation[0]) + col.dim(')') +
             col.yellow(sites) + col.cyan(instances) +
             col.red(parents + etc)

  if (node.identifier) {
    string += col.dim(' = ') + col.green(node.identifier.join(' '))
  }

  string += '\n'

  if (node.visited) return string
  node.visited = true

  if (node.scopeNote) {
    string += depth
    if (narrower.length) string += '│ '
    string += node.scopeNote[graph.language] + '\n'
  }

  // instances
  if (node.subjectOf) {
    for (let i = 0; i < node.subjectOf.length; i++) {
      const item = graph.concepts[ node.subjectOf[i].uri ]

      const label = (item.prefLabel || {})[graph.language] || '???'
      const id = item.notation[0]
      const prefix = narrower.length ? '|' : ' '

      string += col.dim(depth + prefix) +
             col.dim(item.visited ? '=' : '-') +
             col.cyan(label) +
             col.dim(' (') + col.green(id) + col.dim(')') +
             '\n'

      if (item.scopeNote) {
        string += prefix + ' ' + item.scopeNote[graph.language] + '\n'
      }

      item.visited = true
    }
  }

  for (let i = 0; i < narrower.length; i++) {
    const uri = narrower[i].uri
    var last = (i === narrower.length - 1)
    if (!graph.concepts[uri]) continue
    const prefix = graph.concepts[uri].visited
      ? (last ? '╘══' : '╞══')
      : (last ? '└──' : '├──')
    string += col.dim(depth + prefix)
    string += serializeTree(graph, uri, depth + (last ? '   ' : '│  '), col)
  }

  return string
}
