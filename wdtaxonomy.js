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
      results = wdk.simplifySparqlResults(results)
      success(results)
    }
  })
}

function makeTree(results) {
  var edges = {}
  var items = {}

  results.forEach(function(row) {
    var qid     = row.item.value
    var broader = row.broader

    if (broader) {
      if (edges[broader]) {
        edges[broader].push(qid)
      } else {
        edges[broader] = [qid]
      }
    }
    row.broader = []

    if (!items[qid]) {
      row.label = row.item.label || ""
      if (row.label == row.item.value) row.label = ""
      delete row.item
      items[qid] = row
    }
  })

  for (var broader in edges) {
    edges[broader].forEach(function(narrower) {
      items[narrower].broader.push(broader)
    })
  }

  return { items: items, edges: edges }
}

// print taxonomy in CSV format
function printCSV( graph, id, depth ) {
  var node = graph.items[id];
  if (!node) return 

  var label = node.label.replace(',',' ') // for CSV

  if (depth==0) {
    process.stdout.write("level,id,label,sites,instances,parents\n")
  }

  var parents = 1*node.parents
  node.broader.forEach(function(node) {
    if (graph.items[node]) parents--
  })

  var row = [
    Array(depth+1).join( node.visited ? '+' : '*' ),
    id,
    label,
    node.sites,
    node.instances,
    Array(parents+1).join('^')
  ];
  process.stdout.write(row.join(',')+"\n")
  
  if (node.visited) return;
  node.visited = true;

  var narrower = graph.edges[id] || []

  narrower.sort().forEach(function(child) { 
    printCSV(graph, child, depth+1); 
  });
}

program
  .version('0.0.0')
  .arguments('<id>')
  .option('-l, --language [code]', 'language to get labels in')
  .description('extract taxonomies from Wikidata')
  .action(function(id, env) {
    id = normalizeId(id)
	lang = env.language || 'en' // TOOD: get from POSIX?
	sparql = sparqlQuery(id, lang)
	sparqlRequest(sparql, function(results) {
	  graph = makeTree(results)
      printCSV(graph, id, 0)    // TODO: additional output formats
    })
  })
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}


