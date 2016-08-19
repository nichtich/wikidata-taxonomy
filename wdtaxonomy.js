#!/usr/bin/env node

// dependencies
var chalk	= require('chalk')
var wdk 	= require('wikidata-sdk')
var program = require('commander')
var request = require('request-promise')
var Promise = require('bluebird')

var wdt = require('./lib/wikidata-taxonomy.js')

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
function mainSparqlQuery(root, env) {
  var language       = env.language
  var countInstances = !env.noCountInstances && !env.reverse 
  var property = env.properties ? 'P1647' : 'P279'
  var reachable = env.reverse
                ? "wd:"+root+" wdt:"+property+"* ?item"
                : "?item wdt:"+property+"* wd:"+root

  var sparql = `SELECT ?item ?itemLabel ?broader ?parents ?instances ?sites
WHERE {
    {
        SELECT ?item (count(distinct ?parent) as ?parents) {
            ${reachable}
            OPTIONAL { ?item wdt:${property} ?parent }
        } GROUP BY ?item
    }
`
    if (!env.property) { // TODO: get usage of property
      if (countInstances) {
        sparql += `    {
        SELECT ?item (count(distinct ?element) as ?instances) {
            ${reachable}
            OPTIONAL { ?element wdt:P31 ?item }
        } GROUP BY ?item
    }
`     }
      sparql += `    {
        SELECT ?item (count(distinct ?site) as ?sites) {
            ${reachable}
            OPTIONAL { ?site schema:about ?item }
        } GROUP BY ?item
    }
`
    }

    sparql += `    OPTIONAL { ?item wdt:${property} ?broader }
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

// Build graph data from root item and SPARQL results
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
        value:     qid,
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

program
  .version('0.2.6')
  .arguments('<id>')
  .option('-l, --language [code]', 'language to get labels in')
  .option('-s, --sparql', 'print SPARQL query and exit')
  .option('-f, --format [tree|csv|json]', 'output format')
  .option('-i, --instances', 'include instances (only in tree format)')
  .option('-n, --no-colors', 'disable color output')
  .option('-r, --reverse', 'get superclasses instead of subclasses')
  .option('-o, --output [file]', 'write result to a file')
  .description('extract taxonomies from Wikidata')
  .action(function(id, env) {
    if (!env.colors) {
      chalk = new chalk.constructor({enabled: false});
    }
    id = normalizeId(id)
    if (id.substr(0,1) == 'P') {
      env.properties = true
    }

    var out = process.stdout
    if (env.output) {
      out = require('fs').createWriteStream(env.output)
      out.on('error', function(err) { error(2,err) })
      var ext = env.output.split('.').pop()
      if (!env.format && (ext == 'csv' || ext == 'json')) {
        env.format = ext
      }
    }

    env.language = env.language || 'en' // TOOD: get from POSIX?
    format       = env.format || 'tree'

    if (!format.match(/^(tree|csv|json)$/)) {
      error(1,"unsupported format: %s", format)
    }

    if (env.instances && env.reverse) {
      error(1,"option instances and reverse cannot be specified together");
    }

    var queries = [ mainSparqlQuery(id, env) ]
    if (env.instances && !env.properties) {
      queries.push( instancesSparqlQuery(id, env.language) )
    }

    if (env.sparql) {
      out.write(queries.join("\n"))
    } else {
      Promise.all( queries.map(sparqlQuery) )
        .then(function(results) {
          graph = buildGraph(id, results)
          if (env.reverse) {
            var tmp = graph.narrower
            graph.narrower = graph.broader
            graph.broader = tmp
          }
          out.write(wdt.serialize(graph, format))
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

