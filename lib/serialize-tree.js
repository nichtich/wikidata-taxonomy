const { getPrefLabel, getScopeNotes } = require('./jskos')

module.exports = (graph, stream, options) => {
  (graph.topConcepts || []).forEach(concept => {
    stream.write(serializeTree(graph, concept.uri, '', options.chalk))
  })
}

const mappingChar = {
  'http://www.w3.org/2004/02/skos/core#exactMatch': '=',
  'http://www.w3.org/2004/02/skos/core#narrowMatch': '>',
  'http://www.w3.org/2004/02/skos/core#broadMatch': '<',
  'http://www.w3.org/2004/02/skos/core#mappingRelation': '≈'
}

function serializeMappings (mappings, col) {
  return (mappings || []).map(
    m => ' ' + col.dim(mappingChar[m.type[0]]) + col.green(m.to.memberSet[0].uri)
  ).join('')
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
  var isRoot = id === graph.topConcepts[0].uri
  var parents = '↑'.repeat((node.broader || []).length - (isRoot ? 0 : 1))
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
             col.red(parents + etc) +
             serializeMappings(node.mappings, col) + '\n'

  if (node.visited) return string
  node.visited = true

  const scopeNotes = getScopeNotes(node, graph.languages[0])
  if (scopeNotes.length) {
    string += col.dim(depth)
    if (narrower.length) string += col.dim('│ ')
    string += scopeNotes[0] + '\n'
  }

  // instances
  if (node.subjectOf) {
    for (let i = 0; i < node.subjectOf.length; i++) {
      const item = graph.concepts[ node.subjectOf[i].uri ]

      const label = getPrefLabel(item, graph.languages[0], '???')
      const id = item.notation[0]
      const prefix = narrower.length ? '|' : ' '

      string += col.dim(depth + prefix) +
             col.dim(item.visited ? '=' : '-') +
             col.cyan(label) +
             col.dim(' (') + col.green(id) + col.dim(')') +
             serializeMappings(item.mappings, col) + '\n'

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
