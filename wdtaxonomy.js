#!/usr/bin/env node

var chalk	= require('chalk')
var wdk 	= require('wikidata-sdk')
var program = require('commander')
var request = require('request-promise')
var Promise = require('bluebird')

// print error and exit
function error(code) {
  args = [].slice.call(arguments,1)
  args[0] = chalk.red(args[0])
  console.error.apply(null, args)
  process.exit(code)
}

// normalize and check Wikidata identifier
function normalizeId(id) {
  if (id === undefined) {
    error(1,"missing id argument")
  }
  try {
    return wdk.normalizeId(id)
  } catch (err) {
    error(1,"invalid id: %s", id)
  }
}

// construct basic SPARQL query
function mainSparqlQuery(root, language) {

  var sparql = `SELECT ?item ?itemLabel ?broader ?parents ?instances ?sites
WHERE {
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
}`
	return sparql
}

// SPARQL query to get all instances
function instancesSparqlQuery(root, language) {
  return `SELECT ?class ?classLabel ?instance ?instanceLabel WHERE {
    ?class wdt:P279* wd:${root} .
    ?instance wdt:P31 ?class .
    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${language}" .
    }
}`
}

// Ask query.wikidata.org via SPARQL and simplify results
function sparqlQuery(sparql) {
  var url = wdk.sparqlQuery(sparql)
  return request(url).then(wdk.simplifySparqlResults)
}

// Build graph from root item and SPARQL results
function buildGraph(root, results) {
  var graph = buildTree(results[0])
  
  graph.root = root

  if (results[1]) {
    var instances = graph.instances = {}
    var items = graph.items
    results[1].forEach(function(row) {
      var id = row.class.value
      if (!instances[id]) instances[id] = []
      if (!items[row.instance.value]) {
        items[row.instance.value] = row.instance
      }
      instances[id].push(row.instance.value)
    })

    for(var id in instances) {
      instances[id] = instances[id].sort(function(x,y) {
        return items[x].value.substr(1) - items[y].value.substr(1)
      })
    }
  }
  return graph;
}

// build tree structure from results
function buildTree(results) {
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
        parents:   row.parents,
        instances: row.instances,
        sites:     row.sites,
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
    if (broader[id]) {
      broader[id].forEach(function(node) {
        if (items[node]) item.otherparents--
      })
    }
  }

  return { items: items, narrower: narrower, broader: broader }
}

// print taxonomy in tree format
function printTree( graph, id, depth ) {
  var node = graph.items[id];
  if (!node) return

  var label     = node.label == "" ? "???" : node.label
  var sites     = node.sites ? ' •' + node.sites : ''
  var instances = (node.instances && !graph.instances)
                ? ' ×' + node.instances : ''
  var parents   = node.otherparents
                ? ' ' + Array(node.otherparents+1).join('↑') : ''
  var narrower  = graph.narrower[id] || []
  var etc       = node.visited + narrower.length ? " …" : ""

  var row = chalk.blue(label)
          + chalk.dim(' (') + chalk.green(id) + chalk.dim(')')
          + chalk.yellow(sites) + chalk.cyan(instances)
          + chalk.red(parents + etc)

  process.stdout.write(row+"\n")
  if (node.visited) return;
  node.visited = true;

  if (graph.instances) {
    var instances = graph.instances[id] || []
    for(var i=0; i<instances.length; i++) {
      var item = graph.items[ instances[i] ]

      var label  = item.label == "" ? "???" : item.label
      var id     = item.value;
      var prefix = narrower.length ? '|' : ' ';

      var row = chalk.dim(depth + prefix)
        + chalk.dim( item.visited ? '=' : '-' )
        + chalk.cyan(label)
        + chalk.dim(' (') + chalk.green(id) + chalk.dim(')')
        +  "\n"
      process.stdout.write(row)

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
    process.stdout.write(chalk.dim(depth + prefix))
    printTree(graph, cur, depth + (last ? '   ' : '│  '));
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

function printGraph(graph, format) {
  if (format == 'json') {
    printJSON(graph)
  } else if (format == 'csv') {
    printCSV(graph, graph.root, 0)
  } else {
    printTree(graph, graph.root, "")
  }
}

program
  .version('0.2.3')
  .arguments('<id>')
  .option('-l, --language [code]', 'language to get labels in')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-f, --format [tree|csv|json]', 'output format')
  .option('-i, --instances', 'include instances (only in tree format)')
  .option('-n, --no-colors', 'disable color output')
  .description('extract taxonomies from Wikidata')
  .action(function(id, env) {
    if (!env.colors) {
      chalk = new chalk.constructor({enabled: false});
    }
    id     = normalizeId(id)
	lang   = env.language || 'en' // TOOD: get from POSIX?
    format = env.format || 'tree'
    if (!format.match(/^(tree|csv|json)$/)) {
      error(1,"unsupported format: %s", format)
    }

    var queries = [ mainSparqlQuery(id, lang) ]
    if (env.instances) queries.push( instancesSparqlQuery(id, lang) )

    if (env.sparql) {
      process.stdout.write(queries.join("\n"))
    } else {
      Promise.all( queries.map(sparqlQuery) )
        .then(function(results) {
          graph = buildGraph(id, results)
          printGraph(graph, format)
        })
        .catch(function(err) {
          error(2,"SPARQL request failed!")
        })
    }
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}


