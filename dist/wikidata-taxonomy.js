(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wdt = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// utility functions to process JSKOS data
module.exports = {

  getPrefLabel: getPrefLabel,

  getScopeNotes: function getScopeNotes(item) {
    var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'en';
    return getLanguageMapList(item, 'scopeNote', language);
  },

  getOccurrenceCount: function getOccurrenceCount(occurrences, match) {
    return ((occurrences || []).find(function (o) {
      for (var f in match) {
        if (o[f] !== match[f]) return false;
      }
      return true;
    }) || {}).count || 0;
  },

  // depth-first traverse all concepts in a concept scheme
  traverseConcepts: traverseConcepts,

  setMap: setMap,

  pruneHierarchy: pruneHierarchy
};

function getPrefLabel(item) {
  var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'en';
  var fallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

  var prefLabel = item.prefLabel || {};

  language = selectLanguageFromMap(prefLabel, language);

  return language in prefLabel ? prefLabel[language] : fallback;
}

function setMap(set) {
  return set.reduce(function (map, c) {
    map[c.uri] = c;return map;
  }, {});
}

function selectLanguageFromMap(languageMap, language) {
  if (language in languageMap) {
    return language;
  }

  // take the first if required language is not available
  for (var _language in languageMap) {
    return _language;
  }

  return 'en';
}

function getLanguageMapList(item, field, language) {
  var languageMap = item[field] || {};
  language = selectLanguageFromMap(languageMap, language);
  return language in languageMap ? languageMap[language] : [];
}

function traverseConcepts(scheme, callback) {
  if (!scheme.concepts) return;

  var concepts = setMap(scheme.concepts);
  var visited = [];

  var deepFirst = function deepFirst(uri, depth, isSubjectOf) {
    var concept = concepts[uri];
    if (!concept) return;

    callback(concept, depth, visited[uri], isSubjectOf);

    if (!visited[uri]) {
      visited[uri] = true;

      var subjectOf = concept.subjectOf || [];
      // TODO: subjectOf should be stored in the node!
      subjectOf.forEach(function (child) {
        return deepFirst(child.uri, depth + 1, true);
      });

      var narrower = concept.narrower || [];
      narrower.forEach(function (child) {
        return deepFirst(child.uri, depth + 1, false);
      });
    }
  };

  var topConcepts = scheme.topConcepts || [];
  topConcepts.forEach(function (c) {
    return deepFirst(c.uri, 0, false);
  });
}

var pruneChecks = {
  mappings: function mappings(item) {
    return item.mappings && item.mappings.length;
  },
  occurrences: function occurrences(item) {
    return item.occurrences && item.occurrences.length;
  },
  instances: function instances(item) {
    return item.occurrences && item.occurrences.some(function (o) {
      return o.relation === 'http://www.wikidata.org/entity/P31';
    });
  },
  sites: function sites(item) {
    return item.occurrences && item.occurrences.some(function (o) {
      return o.relation === 'http://schema.org/about';
    });
  }
};

function pruneHierarchy(scheme, prune) {
  var concepts = setMap(scheme.concepts);

  if (typeof prune !== 'function') {
    var checks = prune.split(',').map(function (p) {
      if (pruneChecks[p]) return pruneChecks[p];
      throw new Error("Don't know how to prune by " + p);
    });
    if (!checks.length) return;
    prune = function prune(item) {
      return checks.some(function (c) {
        return c(item);
      });
    };
  }

  var keep = {};
  var topConcepts = scheme.topConcepts || [];
  topConcepts.forEach(function (c) {
    keep[c.uri] = true;
  });

  var keepBroader = function keepBroader(item) {
    if (item && item.broader) {
      item.broader.forEach(function (b) {
        if (keep[b.uri]) return;
        keep[b.uri] = true;
        keepBroader(concepts[b.uri]);
      });
    }
  };

  scheme.concepts.forEach(function (item) {
    if (!item || !item.uri || keep[item.uri]) return;
    if (prune(item)) {
      keep[item.uri] = true;
      keepBroader(item);
    }
  });

  // remove pruned items
  scheme.concepts = scheme.concepts.filter(function (c) {
    if (!keep[c.uri]) return;
    if (c.narrower) c.narrower = c.narrower.filter(function (c) {
      return keep[c.uri];
    });
    if (c.broader) c.broader = c.broader.filter(function (c) {
      return keep[c.uri];
    });
    if (c.subjectOf) c.subjectOf = c.subjectOf.filter(function (c) {
      return keep[c.uri];
    });
    return true;
  });
}

},{}],2:[function(require,module,exports){
'use strict';

var equivalences = {
  P1628: [// equivalent property
  'http://www.w3.org/2004/02/skos/core#exactMatch', 'http://www.w3.org/2002/07/owl#equivalentProperty'],
  P1709: [// equivalent class
  'http://www.w3.org/2004/02/skos/core#exactMatch', 'http://www.w3.org/2002/07/owl#equivalentClass'],
  P2888: [// exact match
  'http://www.w3.org/2004/02/skos/core#exactMatch', 'http://schema.org/sameAs'],
  P3950: [// narrower external class
  'http://www.w3.org/2004/02/skos/core#narrowMatch'],
  P2236: [// external subproperty
  'http://www.w3.org/2004/02/skos/core#narrowMatch'],
  P2235: [// external superproperty
  'http://www.w3.org/2004/02/skos/core#broadMatch', 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf']
};

module.exports = {

  shortcuts: {
    'equal': 'P1628,P1709,P2888',
    '=': 'P1628,P1709,P2888',
    'all': 'P1628,P1709,P2888,P2235,P2236,P3950',
    'narrower': 'P3950,P2236',
    'broader': 'P2235',
    'class': 'P1709,P2888,P3950',
    'property': 'P1628,P2235,P2236'
  },

  equivalences: equivalences,

  mappingChars: {
    'http://www.w3.org/2004/02/skos/core#exactMatch': '=',
    'http://www.w3.org/2004/02/skos/core#narrowMatch': '>',
    'http://www.w3.org/2004/02/skos/core#broadMatch': '<',
    'http://www.w3.org/2004/02/skos/core#mappingRelation': '≈'
  },

  // maps Wikidata properties for ontology mapping to JSKOS mapping types
  equivalentTypes: function equivalentTypes(property) {
    return (property in equivalences ? equivalences[property] : ['http://www.w3.org/2004/02/skos/core#mappingRelation']).concat(['http://www.wikidata.org/entity/' + property]);
  }
};

},{}],3:[function(require,module,exports){
'use strict';

var _require = require('./mappings'),
    shortcuts = _require.shortcuts;

// Validate and complement options passed to the query function


module.exports = function (opt) {
  opt = opt || {};
  opt.language = opt.language || opt.lang || 'en';
  opt.property = opt.property || ['P279', 'P31'];
  opt.endpoint = opt.endpoint || 'https://query.wikidata.org/sparql';
  opt.labels = opt.labels !== false;

  if (opt.instances) {
    opt.instancecount = false;
  }

  if (opt.instances && opt.reverse) {
    throw new Error('option instances and reverse cannot be specified together');
  }

  if (opt.mappings in shortcuts) {
    opt.mappings = shortcuts[opt.mappings];
  }

  if (typeof opt.mappings === 'string') {
    opt.mappings = opt.mappings.split(',');
  }

  if (opt.mappings && !opt.mappings.length) {
    opt.mappings = null;
  }

  return opt;
};

},{"./mappings":2}],4:[function(require,module,exports){
(function (global){
"use strict";

var wdk = typeof window !== "undefined" ? window['wdk'] : typeof global !== "undefined" ? global['wdk'] : null;
var sparqlQueries = require('./sparql');
var options = require('./options');

var _require = require('./utils'),
    pushArrayField = _require.pushArrayField,
    values = _require.values;

var executeQuery = require('./request');

var _require2 = require('./transform'),
    itemFromRow = _require2.itemFromRow,
    addMapping = _require2.addMapping;

// promise a taxonomy extracted from Wikidata


module.exports = function (id, env) {
  try {
    env = options(env);
  } catch (e) {
    return Promise.reject(e);
  }

  var queries = sparqlQueries(id, env);

  var simplify = wdk.simplifySparqlResults;

  return Promise.all(queries.map(function (sparql) {
    return executeQuery(sparql, env).then(simplify).then(function (results) {
      return results.map(function (row) {
        ['item', 'class'].forEach(function (field) {
          if (typeof row[field] === 'string') {
            row[field] = { value: row[field] };
          }
        });
        return row;
      });
    });
  })).catch(function (e) {
    throw new Error('SPARQL request failed');
  }).then(function (results) {
    if (results[0].length === 1 && (!results[1] || !results[1].length)) {
      var item = results[0][0];
      if (item.item.label === id && !item.broader && !item.instances && !item.sites) {
        // check whether lonely item/probably actually exists
        return executeQuery('SELECT * WHERE { wd:' + id + ' ?p ?v } LIMIT 1', env).catch(function (e) {
          throw new Error('SPARQL request failed');
        }).then(function (r) {
          return r.length ? buildTaxonomy(id, results, env) : null;
        });
      }
    }
    return buildTaxonomy(id, results, env);
  }).then(function (taxonomy) {
    if (!taxonomy) throw new Error(id + ' not found');
    return taxonomy;
  });
};

// Build graph data from root item and SPARQL results
function buildTaxonomy(root, results, env) {
  var concepts = {};

  // class hierarchy
  results[0].forEach(function (row) {
    var uri = 'http://www.wikidata.org/entity/' + row.item.value;

    if (!concepts[uri]) {
      var item = itemFromRow(row, env.language);

      if (row.instances) {
        pushArrayField(item, 'occurrences', {
          relation: 'http://www.wikidata.org/entity/P31',
          count: row.instances
        });
      }
      if (row.sites) {
        pushArrayField(item, 'occurrences', {
          relation: 'http://schema.org/about',
          count: row.sites
        });
      }

      concepts[uri] = item;
    }

    var cur = concepts[uri];

    addMapping(cur, row.mapping, row.mappingProperty);

    if (row.broader) {
      if (!cur.broader) cur.broader = [];
      var _uri = 'http://www.wikidata.org/entity/' + row.broader;
      if (!cur.broader.find(function (b) {
        return b.uri === _uri;
      })) {
        cur.broader.push({ uri: _uri });
      }
    }
  });

  // add narrower from broader

  var _loop = function _loop(uri) {
    var item = concepts[uri];(item.broader || []).forEach(function (c) {
      if (concepts[c.uri]) {
        pushArrayField(concepts[c.uri], 'narrower', { uri: uri });
      }
    });
  };

  for (var uri in concepts) {
    _loop(uri);
  }

  // add instances
  if (results[1]) {
    results[1].forEach(function (row) {
      var classId = 'http://www.wikidata.org/entity/' + row.class.value;
      var itemId = row.item.value;

      var item = itemFromRow(row, env.language);

      if (!concepts[item.uri]) {
        concepts[item.uri] = item;
      }

      addMapping(item, row.mapping, row.mappingProperty);

      if (concepts[classId]) {
        pushArrayField(concepts[classId], 'subjectOf', { uri: 'http://www.wikidata.org/entity/' + itemId });
      }
    });
  }

  // sort linked concepts by Q/P-ID
  for (var uri in concepts) {
    var item = concepts[uri];
    var _arr = ['narrower', 'broader', 'subjectOf'];
    for (var _i = 0; _i < _arr.length; _i++) {
      var field = _arr[_i];
      if (item[field]) {
        item[field] = item[field].sort(function (a, b) {
          return a.uri.substr(a.uri.lastIndexOf('/') + 2) - b.uri.substr(b.uri.lastIndexOf('/') + 2);
        });
      }
    }
  }

  if (env.reverse) {
    values(concepts).forEach(function (item) {
      var _ref = [item.narrower, item.broader];
      item.broader = _ref[0];
      item.narrower = _ref[1];
    });
  }

  return { // as JSKOS Concept Scheme
    type: ['http://www.w3.org/2004/02/skos/core#ConceptScheme'],
    modified: new Date().toISOString(),
    license: [{
      uri: 'http://creativecommons.org/publicdomain/zero/1.0/',
      notation: ['CC0']
    }],
    languages: [env.language],
    topConcepts: [{ uri: 'http://www.wikidata.org/entity/' + root }],
    concepts: values(concepts)
  };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./options":3,"./request":5,"./sparql":13,"./transform":14,"./utils":15}],5:[function(require,module,exports){
(function (global){
"use strict";

var request = typeof window !== "undefined" ? window['requestPromise'] : typeof global !== "undefined" ? global['requestPromise'] : null;

function queryViaRequest(sparql, env) {
  var options = {
    uri: env.endpoint,
    method: env.post ? 'POST' : 'GET',
    qs: { // query string
      format: 'json',
      query: sparql
    }
    // HTTP Authentication
  };if (env.user || env.password) {
    options.auth = {};
    if (env.user) options.auth.user = env.user;
    if (env.password) options.auth.password = env.password;
  }

  return request(options);
}

module.exports = queryViaRequest;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
'use strict';

var serializeSV = require('./serialize-sv');

var _require = require('./jskos'),
    traverseConcepts = _require.traverseConcepts;

module.exports = function (scheme, stream, options) {
  options.languages = scheme.languages;
  traverseConcepts(scheme, function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return stream.write(serializeSV.apply(undefined, args.concat([options, ',', JSON.stringify])));
  });
};

},{"./jskos":1,"./serialize-sv":9}],7:[function(require,module,exports){
'use strict';

module.exports = function (graph, stream) {
  stream.write(JSON.stringify(graph, null, 2) + '\n');
};

},{}],8:[function(require,module,exports){
'use strict';

var _require = require('./jskos'),
    traverseConcepts = _require.traverseConcepts;

module.exports = function (scheme, stream) {
  traverseConcepts(scheme, function (node, depth, visited) {
    if (!visited) stream.write(JSON.stringify(node) + '\n');
  });
};

},{"./jskos":1}],9:[function(require,module,exports){
'use strict';

var _require = require('./jskos'),
    getPrefLabel = _require.getPrefLabel,
    getOccurrenceCount = _require.getOccurrenceCount;

module.exports = function (node, depth, visited, isSubjectOf, options, separator, esc) {
  var col = options.chalk;
  var delimiter = col.delimiter;

  var label = getPrefLabel(node, options.languages[0]);
  if (esc) label = esc(label);

  var csv = '';
  if (!depth) {
    var header = ['level', 'id', 'label'];

    if (options.sitecount) header.push('sites');
    if (options.instancecount) header.push('instances');

    header.push('parents');
    csv += header.join(delimiter(',')) + '\n';
  }

  var row = [delimiter((node.visited ? '=' : '-').repeat(depth)), col.green(options.uris ? node.uri : node.notation[0]), isSubjectOf ? col.cyan(label) : col.white(label)];

  if (options.sitecount) {
    row.push(col.yellow(getOccurrenceCount(node.occurrences, { relation: 'http://schema.org/about' })));
  }
  if (options.instancecount) {
    row.push(col.cyan(getOccurrenceCount(node.occurrences, { relation: 'http://www.wikidata.org/entity/P31' })));
  }

  var broaderCount = node.broader ? node.broader.length : 0;
  var parents = broaderCount ? '^'.repeat(broaderCount - (!depth ? 0 : 1)) : '';
  row.push(col.red(parents));

  csv += row.join(delimiter(separator)) + '\n';

  return csv;
};

},{"./jskos":1}],10:[function(require,module,exports){
'use strict';

var serializeSV = require('./serialize-sv');

var _require = require('./jskos'),
    traverseConcepts = _require.traverseConcepts;

module.exports = function (scheme, stream, options) {
  options.languages = scheme.languages;
  traverseConcepts(scheme, function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return stream.write(serializeSV.apply(undefined, args.concat([options, '\t'])));
  });
};

},{"./jskos":1,"./serialize-sv":9}],11:[function(require,module,exports){
'use strict';

var _require = require('./jskos'),
    getPrefLabel = _require.getPrefLabel,
    getScopeNotes = _require.getScopeNotes,
    getOccurrenceCount = _require.getOccurrenceCount,
    setMap = _require.setMap;

var _require2 = require('../lib/mappings'),
    mappingChars = _require2.mappingChars;

module.exports = function (kos, stream, options) {
  if (!kos.topConcepts || !kos.concepts) return;
  var concepts = setMap(kos.concepts);
  kos.topConcepts.forEach(function (concept) {
    stream.write(serializeTree(kos, concepts, concept.uri, '', options));
  });
};

function serializeMappings(mappings, options) {
  var chalk = options.chalk;
  return (mappings || []).map(function (m) {
    return ' ' + chalk.dim(mappingChars[m.type[0]]) + chalk.green(m.to.memberSet[0].uri);
  }).join('');
}

function serializeTree(graph, concepts, uri, depth, options) {
  var node = concepts[uri];
  if (!node) return '\n';

  var col = options.chalk;
  var delimiter = col.delimiter;

  var label = getPrefLabel(node, graph.languages[0], '???');

  var broader = node.broader || [];
  var isRoot = uri === graph.topConcepts[0].uri || !broader.length;
  var parents = '↑'.repeat(broader.length - (isRoot ? 0 : 1));
  parents = parents ? ' ' + parents : '';

  var narrower = node.narrower || [];
  var etc = node.visited + narrower.length ? ' …' : node.multi > 1 ? '=' : ''; // TODO: set multihierarchy

  // check whether item is an instance at level 0 (FIXME)
  var color = uri.substr(0, 1) === 'Q' && !depth && !node.subjectOf && broader.length <= 1 && !narrower.length ? 'cyan' : 'white';

  var id = options.uris ? uri : node.notation[0];

  var string = col[color](label) + delimiter(' (') + col.green(id) + delimiter(')');

  if (options.sitecount) {
    var count = getOccurrenceCount(node.occurrences, { relation: 'http://schema.org/about' });
    if (count) string += col.yellow(' •' + count);
  }

  if (options.instancecount && !node.subjectOf) {
    var _count = getOccurrenceCount(node.occurrences, { relation: 'http://www.wikidata.org/entity/P31' });
    if (_count) string += col.cyan(' ×' + _count);
  }

  string += col.red(parents + etc) + serializeMappings(node.mappings, options) + '\n';

  if (node.visited) return string;
  node.visited = true;

  var scopeNotes = getScopeNotes(node, graph.languages[0]);
  if (scopeNotes.length) {
    string += delimiter(depth);
    if (narrower.length) string += delimiter('│ ');
    string += scopeNotes[0] + '\n';
  }

  // instances
  if (node.subjectOf) {
    for (var i = 0; i < node.subjectOf.length; i++) {
      var item = concepts[node.subjectOf[i].uri];

      var _label = getPrefLabel(item, graph.languages[0], '???');
      var _id = options.uris ? item.uri : item.notation[0];
      var prefix = narrower.length ? '|' : ' ';

      string += delimiter(depth + prefix) + delimiter(item.visited ? '=' : '-') + col.cyan(_label) + delimiter(' (') + col.green(_id) + delimiter(')') + serializeMappings(item.mappings, options) + '\n';

      if (item.scopeNote) {
        string += prefix + ' ' + item.scopeNote[graph.language] + '\n';
      }

      item.visited = true;
    }
  }

  for (var _i = 0; _i < narrower.length; _i++) {
    var _uri = narrower[_i].uri;
    var last = _i === narrower.length - 1;

    if (!concepts[_uri]) continue;
    var _prefix = concepts[_uri].visited ? last ? '╘══' : '╞══' : last ? '└──' : '├──';
    string += delimiter(depth + _prefix);
    string += serializeTree(graph, concepts, _uri, depth + (last ? '   ' : '│  '), options);
  }

  return string;
}

},{"../lib/mappings":2,"./jskos":1}],12:[function(require,module,exports){
'use strict';

module.exports = {
  json: require('./serialize-json'),
  ndjson: require('./serialize-ndjson'),
  csv: require('./serialize-csv'),
  tsv: require('./serialize-tsv'),
  txt: require('./serialize-txt')

  // alias
};module.exports.tree = module.exports.text;

},{"./serialize-csv":6,"./serialize-json":7,"./serialize-ndjson":8,"./serialize-tsv":10,"./serialize-txt":11}],13:[function(require,module,exports){
'use strict';

var options = require('./options');

module.exports = function (id, env) {
  env = options(env);
  var queries = [hierarchyQuery(id, env)];
  if (env.instances) {
    queries.push(instancesQuery(id, env));
  }
  return queries;
};

function hierarchyQuery(root) {
  var env = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var property = env.property;
  var path = env.children ? '?' : '*';

  var items = 'SELECT DISTINCT ?item { ' + (env.reverse ? 'wd:' + root + ' wdt:' + property[0] + path + ' ?item' : '?item wdt:' + property[0] + path + ' wd:' + root) + ' }';

  var vars = '?item ?broader';

  if (env.labels !== false) {
    vars += ' ?itemLabel';
    if (env.description) vars += ' ?itemDescription';
  }

  var sparql = '\n    OPTIONAL { ?item wdt:' + property[0] + ' ?broader } .';

  var details = [];

  if (env.instancecount) {
    var total = env.total ? '/wdt:' + property[0] + '*' : '';
    vars += ' ?instances';
    details.push('\n      SELECT ?item (count(distinct ?element) as ?instances) {\n        INCLUDE %items.\n        OPTIONAL { ?element wdt:' + property[1] + total + ' ?item }\n      } GROUP BY ?item');
  }

  if (env.sitecount) {
    vars += ' ?sites';
    details.push('\n      SELECT ?item (count(distinct ?site) as ?sites) {\n        INCLUDE %items.\n        OPTIONAL { ?site schema:about ?item }\n      } GROUP BY ?item');
  }

  if (env.mappings) {
    vars += ' ?mapping ?mappingProperty';
    details.push(mappingsQuery(env.mappings));
  }

  sparql += details.map(function (s) {
    return '\n    {' + s + '\n    }';
  }).join('');

  return sparqlItemsQuery(vars, items, sparql, env);
}

function sparqlItemsQuery(vars, selectItems, where, options) {
  if (options.labels) {
    where += '\n    SERVICE wikibase:label {\n      bd:serviceParam wikibase:language "' + options.language + '"\n    }';
  }

  return '  SELECT ' + vars + ' WITH {\n    ' + selectItems + '\n  } AS %items WHERE { \n    INCLUDE %items .' + where + '\n  }';
}

function mappingsQuery(mappings) {
  mappings = mappings.map(function (p) {
    return '{ ?item wdt:' + p + " ?mapping . BIND('" + p + "' AS ?mappingProperty) }";
  }).join(' UNION\n          ');
  return '\n      SELECT ?item ?mapping ?mappingProperty {\n        INCLUDE %items .\n        OPTIONAL {\n          ' + mappings + '\n        }\n      }';
}

// SPARQL query to get all instances
function instancesQuery(root, env) {
  var vars = '?class ?item';

  if (env.labels !== false) {
    vars += ' ?classLabel ?itemLabel';
    if (env.description) vars += ' ?itemDescription';
  }

  var sparql = '';
  if (env.mappings) {
    vars += ' ?mapping ?mappingProperty';
    sparql += '\n    { ' + mappingsQuery(env.mappings) + '\n    }';
  }

  var items = 'SELECT ?class ?item {\n      ?class wdt:' + env.property[0] + '* wd:' + root + ' .\n      ?item wdt:' + env.property[1] + ' ?class .\n    }';

  return sparqlItemsQuery(vars, items, sparql, env);
}

},{"./options":3}],14:[function(require,module,exports){
'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('./mappings'),
    equivalentTypes = _require.equivalentTypes;

module.exports = {

  itemFromRow: function itemFromRow(row, language) {
    var item = {
      uri: 'http://www.wikidata.org/entity/' + row.item.value,
      notation: [row.item.value]
    };

    if (row.item.label && row.item.label !== row.item.value) {
      item.prefLabel = _defineProperty({}, language, row.item.label);
    }

    if (row.itemDescription) {
      item.scopeNote = _defineProperty({}, language, [row.itemDescription]);
    }

    return item;
  },

  addMapping: function addMapping(concept, mapping, property) {
    if (!mapping) {
      return;
    }

    if (!concept.mappings) concept.mappings = [];

    if (!concept.mappings.find(function (m) {
      return m.to.memberSet[0].uri === mapping && m.type[m.type.length - 1] === 'http://www.wikidata.org/entity/' + property;
    })) {
      concept.mappings.push({
        from: { memberSet: [{ uri: concept.uri }] },
        // FIXME: mapping may have other datatype but URI
        to: { memberSet: [{ uri: mapping }] },
        type: equivalentTypes(property)
      });
    }
  }
};

},{"./mappings":2}],15:[function(require,module,exports){
"use strict";

module.exports = {
  pushArrayField: function pushArrayField(obj, field, value) {
    obj[field] = obj[field] || [];
    obj[field].push(value);
  },
  values: function values(obj) {
    return Object.keys(obj).map(function (key) {
      return obj[key];
    });
  }
};

},{}],16:[function(require,module,exports){
'use strict';

module.exports = {
  serializeTaxonomy: require('./lib/serialize'),
  queryTaxonomy: require('./lib/query'),
  sparqlQueries: require('./lib/sparql')
};

},{"./lib/query":4,"./lib/serialize":12,"./lib/sparql":13}]},{},[16])(16)
});