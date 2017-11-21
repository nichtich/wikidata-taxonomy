const equivalences = {
  P1628: [ // equivalent property
    'http://www.w3.org/2004/02/skos/core#exactMatch',
    'http://www.w3.org/2002/07/owl#equivalentProperty'
  ],
  P1709: [ // equivalent class
    'http://www.w3.org/2004/02/skos/core#exactMatch',
    'http://www.w3.org/2002/07/owl#equivalentClass'
  ],
  P2888: [ // exact match
    'http://www.w3.org/2004/02/skos/core#exactMatch',
    'http://schema.org/sameAs'
  ],
  P3950: [ // narrower external class
    'http://www.w3.org/2004/02/skos/core#narrowMatch'
  ],
  P2236: [ // external subproperty
    'http://www.w3.org/2004/02/skos/core#narrowMatch'
  ],
  P2235: [ // external superproperty
    'http://www.w3.org/2004/02/skos/core#broadMatch',
    'http://www.w3.org/2000/01/rdf-schema#subPropertyOf'
  ]
}

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
  equivalentTypes: property =>
    (property in equivalences
      ? equivalences[property]
      : [ 'http://www.w3.org/2004/02/skos/core#mappingRelation' ]
    ).concat(['http://www.wikidata.org/entity/' + property])
}
