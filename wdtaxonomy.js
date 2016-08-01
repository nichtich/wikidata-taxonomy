#!/usr/bin/env node

var chalk	= require('chalk')
var wdk 	= require('wikidata-sdk')
var program = require('commander')
var request = require('request')

// print error and exit
function error(msg) {
  args = [].slice.call(arguments,1);
  console.error(chalk.red(msg), args)
  process.exit(1)
}

// normalize and check Wikidata identifier
function normalizeId(id) {
  if (id === undefined) {
    error("missing id argument")
  }
  try {
    return wdk.normalizeId(id)
  } catch (err) {
    error("invalid id: %s", id)
  }
}

// construct SPARQL query
function sparqlQuery(root, language) {

  var sparql = `SELECT ?item ?itemLabel ?broader ?parents ?instances ?sites 
WHERE
{
    { 
        SELECT ?item (count(distinct ?parent) as ?parents) {
            ?item wdt:P279* wd:${root}
            OPTIONAL { ?item wdt:P279 ?parent }
        } GROUP BY ?item 
    }
    { 
        SELECT ?item (count(distinct ?element) as ?instances) {
            ?item wdt:P279* wd:${root}
            OPTIONAL { ?element wdt:P31 ?item }
        } GROUP BY ?item 
    }
    { 
        SELECT ?item (count(distinct ?site) as ?sites) {
            ?item wdt:P279* wd:${root}
            OPTIONAL { ?site schema:about ?item }
        } GROUP BY ?item 
    }
    OPTIONAL { ?item wdt:P279 ?broader }
    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${language}" .
    }
}
`
	return sparql
}

// perform SPARQL query
function sparqlRequest(sparql, success) {
  var url = wdk.sparqlQuery(sparql)

  request(url, function (err, res) {
    if (err) {
        error(err)
    } else {
      results = res.body
      try { // TODO: fix bug? in wikidata-sdk
        results = wdk.simplifySparqlResults(results)
      } catch(err) {
        error("no taxonomy found"+err)
      }
      success(results)
    }
  })
}

function makeTree(results) {
  var items    = {}
  var narrower = {}
  var broader  = {}

  results.forEach(function(row) {
    var qid       = row.item.value
    var broaderId = row.broader

    if (broaderId) {
      if (narrower[broaderId]) {
        narrower[broaderId].push(qid)
      } else {
        narrower[broaderId] = [qid]
      }
    }

    if (!items[qid]) {
      item = {
        label:     row.item.label || "",
        parents:   1*row.parents,
        instances: 1*row.instances,
        sites:     1*row.sites,
        broader:   []
      }
      if (item.label == row.item.value) item.label = ""
      items[qid] = item
    }
  })
      
  for (var id in narrower) {
    // sort child nodes by Wikidata id
    narrower[id] = narrower[id].sort(function(x,y) {
      return x.substr(1) - y.substr(1)
    })
    // add reverse
    narrower[id].forEach(function(b) {
      if (!broader[b]) broader[b] = []
      broader[b].push(id)
    })
  }

  for (var id in items) {
    var item = items[id]
    item.otherparents = item.parents
    broader[id].forEach(function(node) {
      if (items[node]) item.otherparents--
    })
  }

  return { items: items, narrower: narrower, broader: broader }
}

// print taxonomy in CSV format
function printTree( graph, id, depth ) {
  var node = graph.items[id];
  if (!node) return 

  var label     = node.label == "" ? "???" : node.label
  var sites     = node.sites ? ' •' + node.sites : ''
  var instances = node.instances ? ' ×' + node.instances : ''
  var parents   = Array(node.otherparents+1).join('^')
  var narrower  = graph.narrower[id] || []

  var row = label + ` (${id})`
  row += `${sites}${instances} ${parents}`
  if (node.visited + narrower.length) row += " …"
  process.stdout.write(row+"\n")
  if (node.visited) return;
  node.visited = true;

  for(var i=0; i<narrower.length; i++) {
    var last = (i == narrower.length-1)
    if (graph.items[narrower[i]].visited) { 
      prefix = last ? '╘══' : '╞══'
    } else {
      prefix = last ? '└──' : '├──'
    }
    process.stdout.write(depth + prefix)
    printTree(graph, narrower[i], depth + (last ? '   ' : '|  ')); 
  }
}

// print taxonomy in CSV format
function printCSV( graph, id, depth ) {
  var node = graph.items[id];
  if (!node) return 

  var label = node.label.replace(',',' ') // for CSV

  if (depth==0) {
    process.stdout.write("level,id,label,sites,instances,parents\n")
  }

  var row = [
    Array(depth+1).join( node.visited ? '=' : '-' ),
    id,
    label,
    node.sites,
    node.instances,
    Array(node.otherparents+1).join('^')
  ];
  process.stdout.write(row.join(',')+"\n")
  
  if (node.visited) return;
  node.visited = true;

  var narrower = graph.narrower[id] || []
  narrower.forEach(function(child) { 
    printCSV(graph, child, depth+1); 
  });
}

function printJSON(graph) {
  // TODO: use canonical-json
  process.stdout.write(JSON.stringify(graph, null, 4) + '\n')
}

program
  .version('0.1.1')
  .arguments('<id>')
  .option('-l, --language [code]', 'language to get labels in')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-f, --format [tree|csv|json]', 'output format')
  .description('extract taxonomies from Wikidata')
  .action(function(id, env) {
    id     = normalizeId(id)
	lang   = env.language || 'en' // TOOD: get from POSIX?
    format = env.format || 'tree'
    if (!format.match(/^(tree|csv|json)$/)) {
      error("unsupported format: %s", format)
    }
	sparql = sparqlQuery(id, lang)
    if (env.sparql) {
      process.stdout.write(sparql)
    } else {
      sparqlRequest(sparql, function(results) {
	    graph = makeTree(results)
        graph.root = id
        if (format == 'json') {
          printJSON(graph)
        } else if (format == 'csv') {
          printCSV(graph, graph.root, 0)
        } else {
          printTree(graph, graph.root, "")
        }
      })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}


