var chalk	= require('chalk')

exports = module.exports = {
  serialize: serialize,  
  serializer: {
    tree: serializeTree,
    json: serializeJSON,
    csv:  serializeCSV
  } 
}

// taxonomy in given format or tree format
function serialize(graph, format) {
  if (format == 'json') {
    return serializeJSON(graph)
  } else if (format == 'csv') {
    return serializeCSV(graph, graph.root, 0)
  } else {
    return serializeTree(graph, graph.root, "")
  }
}

// taxonomy in tree format
function serializeTree( graph, id, depth ) {
  var node = graph.items[id];
  if (!node) return ''

  var label     = node.label == "" ? "???" : node.label
  var sites     = node.sites ? ' •' + node.sites : ''
  var instances = (node.instances && !graph.instances)
                ? ' ×' + node.instances : ''
  var parents   = node.otherparents
                ? ' ' + Array(node.otherparents+1).join('↑') : ''
  var narrower  = graph.narrower[id] || []
  var etc       = node.visited + narrower.length ? ' …'
                : (node.multi > 1 ? '=' : '') // TODO: set multihierarchy

  var string = chalk.blue(label)
             + chalk.dim(' (') + chalk.green(id) + chalk.dim(')')
             + chalk.yellow(sites) + chalk.cyan(instances)
             + chalk.red(parents + etc)
             + "\n"

  if (node.visited) return string;
  node.visited = true;

  if (graph.instances) {
    var instances = graph.instances[id] || []
    for(var i=0; i<instances.length; i++) {
      var item = graph.items[ instances[i] ]

      var label  = item.label == "" ? "???" : item.label
      var id     = item.value;
      var prefix = narrower.length ? '|' : ' ';

      string += chalk.dim(depth + prefix)
      string += chalk.dim( item.visited ? '=' : '-' )
      string += chalk.cyan(label)
      string += chalk.dim(' (') + chalk.green(id) + chalk.dim(')')
      string +=  "\n"

      item.visited = true
    }
  }

  for(var i=0; i<narrower.length; i++) {
    var cur  = narrower[i]
    var last = (i == narrower.length-1)
    if (graph.items[cur].visited) {
      prefix = last ? '╘══' : '╞══'
    } else {
      prefix = last ? '└──' : '├──'
    }
    string += chalk.dim(depth + prefix)
    string += serializeTree(graph, cur, depth + (last ? '   ' : '│  '));
  }

  return string
}

// taxonomy in CSV format
function serializeCSV( graph, id, depth ) {
  var node = graph.items[id];
  var csv = ''
  if (!node) return csv

  var label = node.label.replace(',',' ') // for CSV

  if (depth==0) {
    csv += "level,id,label,sites,instances,parents\n"
  }

  var row = [
    Array(depth+1).join( node.visited ? '=' : '-' ),
    id,
    label,
    node.sites,
    node.instances,
    Array(node.otherparents+1).join('^')
  ];
  csv += row.join(',') + "\n"

  if (!node.visited) {
    node.visited = true;
    var narrower = graph.narrower[id] || []
    narrower.forEach( (child) => {
      csv += serializeCSV(graph, child, depth+1);
    })
  }

  return csv
}

// taxonomy in pretty JSON format
function serializeJSON(graph) {
  return JSON.stringify(graph, null, 4) + '\n'
}

