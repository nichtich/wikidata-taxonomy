const { getPrefLabel, getScopeNotes, getOccurrenceCount, setMap } = require('./jskos')
const { mappingChars } = require('../lib/mappings')

module.exports = (kos, stream, options) => {
  if (!kos.topConcepts || !kos.concepts) return
  const concepts = setMap(kos.concepts)
  kos.topConcepts.forEach(concept => {
    stream.write(serializeTree(kos, concepts, concept.uri, '', options))
  })
}

function serializeMappings (mappings, options) {
  const chalk = options.chalk
  return (mappings || []).map(
    m => ' ' + chalk.dim(mappingChars[m.type[0]]) + chalk.green(m.to.memberSet[0].uri)
  ).join('')
}

function serializeTree (graph, concepts, uri, depth, options) {
  var node = concepts[uri]
  if (!node) return '\n'

  const col = options.chalk
  const label = getPrefLabel(node, graph.languages[0], '???')

  var broader = node.broader || []
  var isRoot = uri === graph.topConcepts[0].uri || !broader.length
  var parents = '↑'.repeat(broader.length - (isRoot ? 0 : 1))
  parents = parents ? ' ' + parents : ''

  var narrower = node.narrower || []
  var etc = node.visited + narrower.length ? ' …'
                : (node.multi > 1 ? '=' : '') // TODO: set multihierarchy

  // check whether item is an instance at level 0 (FIXME)
  var color = (uri.substr(0, 1) === 'Q' && !depth && !node.subjectOf &&
               broader.length <= 1 && !narrower.length)
            ? 'cyan' : 'white'

  const id = options.uris ? uri : node.notation[0]

  var string = col[color](label) +
             col.dim(' (') + col.green(id) + col.dim(')')

  if (options.sitecount) {
    const count = getOccurrenceCount(node.occurrences, {relation: 'http://schema.org/about'})
    if (count) string += col.yellow(' •' + count)
  }

  if (options.instancecount && !node.subjectOf) {
    const count = getOccurrenceCount(node.occurrences, {relation: 'http://www.wikidata.org/entity/P31'})
    if (count) string += col.cyan(' ×' + count)
  }

  string += col.red(parents + etc) +
             serializeMappings(node.mappings, options) + '\n'

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
      const item = concepts[ node.subjectOf[i].uri ]

      const label = getPrefLabel(item, graph.languages[0], '???')
      const id = options.uris ? item.uri : item.notation[0]
      const prefix = narrower.length ? '|' : ' '

      string += col.dim(depth + prefix) +
             col.dim(item.visited ? '=' : '-') +
             col.cyan(label) +
             col.dim(' (') + col.green(id) + col.dim(')') +
             serializeMappings(item.mappings, options) + '\n'

      if (item.scopeNote) {
        string += prefix + ' ' + item.scopeNote[graph.language] + '\n'
      }

      item.visited = true
    }
  }

  for (let i = 0; i < narrower.length; i++) {
    const uri = narrower[i].uri
    var last = (i === narrower.length - 1)

    if (!concepts[uri]) continue
    const prefix = concepts[uri].visited
      ? (last ? '╘══' : '╞══')
      : (last ? '└──' : '├──')
    string += col.dim(depth + prefix)
    string += serializeTree(graph, concepts, uri, depth + (last ? '   ' : '│  '), options)
  }

  return string
}
