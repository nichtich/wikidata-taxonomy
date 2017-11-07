# Wikidata-Taxonomy

Command-line tool to extract taxonomies from [Wikidata](https://wikidata.org).

![](https://github.com/nichtich/wikidata-taxonomy/raw/master/img/wdtaxonomy-example.png)

## Installation

wikidata-taxonomy requires at least [NodeJs](https://nodejs.org) version 6.

Install globally to make command `wdtaxonomy` accessible from your shell `$PATH`:

```sh
$ npm install -g wikidata-taxonomy
```

## Usage

This module provides the command `wdtaxonomy`. By default, a usage help is printed:

```sh
$ wdtaxonomy

  Usage: wdtaxonomy [options] <id>

  extract taxonomies from Wikidata

  Options:

    -V, --version                        output the version number
    -b, --brief                          omit counting instances and sites
    -c, --children                       get direct subclasses only
    -d, --descr                          include item descriptions
    -e, --sparql-endpoint <url>          customize the SPARQL endpoint
    -f, --format <tree|csv|json|ndjson>  output format
    -i, --instances                      include instances (tree format)
    -l, --lang <lang>                    specify the language to use
    -m, --mappings <ids>                 mapping properties (e.g. P1709)
    -n, --no-colors                      disable color output
    -o, --output <file>                  write result to a file
    -P, --property <id>                  hierarchy property (e.g. P279)
    -p, --post                           use HTTP POST to disable caching
    -r, --reverse                        get superclasses instead
    -s, --sparql                         print SPARQL query and exit
    -t, --total                          count total number of instances
    -u, --user <name>                    user to the SPARQL endpoint
    -v, --verbose                        make the output more verbose
    -w, --password <string>              password to the SPARQL endpoint
    -h, --help                           output usage information
```

The first arguments needs to be a Wikidata identifier to be used as root of the taxonomy. For instance extract a taxonomy of planets ([Q634]):

```sh
$ wdtaxonomy Q634
```

To look up by label, use [wikidata-cli]:


```sh
$ wdtaxonomy `wd id Planet`
```

The extracted taxonomy is based on statements using the property "subclass of" ([P279]) or "subproperty of" ([P1647]) and additional statistics.  Option `--sparql` prints the SPARQL queries that are used.

Taxonomy extraction and output can be controlled by several [options](#options).

### Examples

**Direct subclasses of planet ([Q634]) with description and mappings:**

    $ wdtaxonomy.js Q634 -c -d -m =

The hierarchy properties [P279] ("subclass of") and [P31] ("instance of") to build taxonomies from can be changed with option `property` (`-P`).

**Members of ([P463]) the European Union ([Q458]):**

    $ wdtaxonomy Q458 -P P463

**Members of ([P463]) the European Union ([Q458]) and number of its citizens in
Wikidata ([P27]):**

    $ wdtaxonomy Q458 -P 463/27

**Wikiversity ([Q370]) editions mapped to their homepage URL ([P856]):**

    $ wdtaxonomy Q370 -i -m P856

**Biological taxonomy of mammals ([Q7377]):**

    $ wdtaxonomy Q7377 -P P171 --brief

**Property constraints ([Q21502402]) with number of properties that have each constraint:**

    $ wdtaxonomy Q21502402 -P 279,2302 

As Wikidata is no strict ontology, subproperties are not factored in. For
instance this query does not include members of the European Union although
P463 is a subproperty of P361.

**Parts of ([P361]) the European Union ([Q458]):**

    $ wdtaxonomy Q458 -P P361

A taxonomy of subproperties can be queried like taxonomies of items. The
hierarchy property is set to P1647 ("subproperty of") by default:

    $ wdtaxonomy P361
    $ wdtaxonomy P361 -P P1647  # equivalent

**Subproperties of "part of" ([P361]) and which of them have an inverse property
([P1696]):**

    $ wdtaxonomy P361 -P P1647/P1696

Inverse properties are neither factored in so queries like these do not
necesarrily return the same results:

**What hand ([Q33767]) is part of ([P361]):**

    $ wdtaxonomy Q33767 -P 361 -r

**What parts the hand ([Q33767]) has ([P527]):**

    $ wdtaxonomy Q33767 -P 527

## Options

### Query options

#### brief (`-b`)

Don't count instance and sites

#### children (`-c`)

Get direct subclasses only

#### descr (`-d`)

Include item descriptions

#### sparql-endpoint (`-e`)

SPARQL endpoint to query (default: <https://query.wikidata.org/sparql>)

#### instances (`-i`)

include instances

#### lang (`-l`)

language to get labels in (default: `en`)

#### mappings (`-m`)

lookup mappings based on given comma-separated properties such as [P1709] (equivalent class). The following keywords can be used as shortcuts:

* `equal` or `=`: equivalent property ([P1628]), equivalent class ([P1709]), and exact match ([P2888])
* `broader`: external superproperty ([P2235])
* `narrower`: narrower external class ([P3950]), external subproperty ([P2236])
* `all` all properties for ontology mapping (instances of Q30249126)

#### reverse (`-r`)

get superclasses instead of subclasses up to the root

#### total (`-t`)

count total (transitive) number of instances, including instances of subclasses

#### post (`-p`)

use HTTP POST to disable caching

#### sparql (`-s`)

Don't actually perform a query but print SPARQL query and exit

#### user (`-u`)

User to the SPARQL endpoint

#### password (`-w`)

Password to the SPARQL endpoint

### Output options

#### format (`-f`)

Output format

#### no-colors (`-n`)

disable color output. It's also possible to enforce color with `--color`

#### output (`-o`)

write result to a file given by name

#### verbose (`-v`)

show verbose error messages

## Output formats

### Tree format

By default, the taxonomy is printed in "`tree`" format with colored Unicode characters:

```sh
$ wdtaxonomy Q17362350
```
```
planet of the Solar System (Q17362350) •2 ↑
├──outer planet (Q30014) •25 ×4 ↑↑
└──inner planets (Q3504248) •8 ×4 ↑↑

```

The output contains item labels, Wikidata identifiers, the number of Wikimedia
sites connected to each item (indicated by bullet character "`•`"), the number
of instances (property [P31]), indicated by a multiplication sign "`×`"), and
an upwards arrow ("`↑`") as indicator for additional superclasses.

Option "`--instances`" (or "`-i`") explicitly includes instances:

```sh
$ wdtaxonomy -i Q17362350
```
```
planet of the Solar System (Q17362350) •2 ↑
├──outer planet (Q30014) •25 ↑↑
|   -Saturn (Q193)
|   -Jupiter (Q319)
|   -Uranus (Q324)
|   -Neptune (Q332)
└──inner planets (Q3504248) •8 ↑↑
    -Earth (Q2)
    -Mars (Q111)
    -Mercury (Q308)
    -Venus (Q313)
```

Classes that occur at multiple places in the taxonomy (multihierarchy) are marked like in the following example:

```sh
$ wdtaxonomy Q634
```
```
planet (Q634) •202 ×7 ↑
├──extrasolar planet (Q44559) •88 ×833 ↑
|  ├──circumbinary planet (Q205901) •15 ×10
|  ├──super-Earth (Q327757) •32 ×46 ↑
...
├──terrestrial planet (Q128207) •70 ×7
|  ╞══super-Earth (Q327757) •32 ×46 ↑ …
...
```

### JSON format

Option `--format json` serializes the taxonomy as JSON object. The format follows specification of [JSKOS Concept Schemes](https://gbv.github.io/jskos/jskos.html#concept-schemes):

~~~json
{
  "type": [ "http://www.w3.org/2004/02/skos/core#ConceptScheme" ],
  "modified": "2017-11-06T10:25:54.966Z",
  "license": [
    {
      "uri": "http://creativecommons.org/publicdomain/zero/1.0/",
      "notation": [ "CC0" ]
    }
  ],
  "languages": [ "en" ],
  "topConcepts": [
    { "uri": "http://www.wikidata.org/entity/Q17362350" }
  ],
  "concepts": [ ]
}
~~~

Field `concepts` contains an array of all extracted Wikidata entities (usually classes and instances) as [JSKOS Concepts](https://gbv.github.io/jskos/jskos.html#concepts):

~~~json
{
  "uri": "http://www.wikidata.org/entity/Q17362350",
  "notation": [ "Q17362350" ],
  "prefLabel": {
    "en": "planet of the Solar System"
  },
  "scopeNote": {
    "en": [ "inner and outer planets of our solar system" ]
  },
  "broader": [
    { "uri": "http://www.wikidata.org/entity/Q634" }
  ],
  "narrower": [
    { "uri": "http://www.wikidata.org/entity/Q30014" },
    { "uri": "http://www.wikidata.org/entity/Q3504248" }
  ]
}
~~~

Instances (option `--instances`) are linked via field `subjectOf` the same way as field `broader` and `narrower`.

Mappings (option `--mappings`) are stored in field `mappings` as array of [JSKOS Concept Mappings](https://gbv.github.io/jskos/jskos.html#concept-mappings):

~~~json
[
  {
    "from": {
      "memberSet": [
        { "uri": "http://www.wikidata.org/entity/Q634" }
      ]
    },
    "to": {
      "memberSet": [
        { "uri": "http://dbpedia.org/ontology/Planet" }
      ]
    },
    "type": [
      "http://www.w3.org/2004/02/skos/core#exactMatch",
      "http://www.w3.org/2002/07/owl#equivalentClass",
      "http://www.wikidata.org/entity/P1709"
    ]
  }
]
~~~

The mapping type is given in field `type` with the Wikidata property URI as last array element and the SKOS mapping relation URI as first.

## NDJSON format

Option `--format ndjson` serializes JSON field `concepts` with one record per line.

### CSV format

The CSV format ("`--format csv`") is optimized for comparing differences in
time.  Each output row consists of five fields:

* **level** in the hierarchy indicated by zero or more "`-`" (default) or "`=`"
  characters (multihierarchy).

* **id** of the item. Items on the same level are sorted by their id.

* **label** of the item. Language can be selected with option `--language`.
  The character `,` in labels is replaces by a whitespace.

* **sites**: number of connected sites (Wikipedia and related project editions).
  Larger numbers may indicate more established concepts.

* **parents** outside of the hierarchy, indicated by zero or more "`^`" characters.

For instance the CSV output for [Q634] would be like this:

```sh
$ wdtaxonomy -f csv Q634
```
```csv
level,id,label,sites,instances,parents
,Q634,planet,196,7,^
-,Q44559,extrasolar planet,81,833,^
--,Q205901,circumbinary planet,14,10,
--,Q327757,super-Earth,32,46,
...
-,Q128207,terrestrial planet,67,7,
==,Q327757,super-Earth,32,46,
...

```

In this example there are 196 Wikipedia editions or other sites with an article
about planets and seven Wikidata items are direct instance of a planet. At the
end of the line "`^`" indicates that "planet" has one superclass. In the next
rows "extrasolar planet" ([Q44559]) is a subclass of planet with another
superclass indicated by "`^`". Both "circumbinary planet" and "super-Earth" are
subclasses of "extrasolar planet". The latter also occurs as subclass of
"terrestrial planet" where it is marked by "`==`" instead of "`--`".

## Usage as module

~~~json
const { queryTaxonomy, serializeTaxonomy } = require('wikidata-taxonomy')

// serialize taxonomy to stream
serializeTaxonomy.csv(taxonomy, process.stdout)
serializeTaxonomy.text(taxonomy, process.stdout, {colors: true})
serializeTaxonomy.json(taxonomy, process.stdout)
serializeTaxonomy.ndjson(taxonomy, process.stdout)
~~~

## Usage in web applications

Requires wikidata-sdk and jQuery (but no other dependencies).

See directory `example` for a demo.

## Release notes

Release notes are listed in file [CHANGES.md](https://github.com/nichtich/wikidata-taxonomy/blob/master/CHANGES.md#changelog) in the source code repository.

## See Also

[![build status](https://api.travis-ci.org/nichtich/wikidata-taxonomy.svg?branch=master)](http://travis-ci.org/nichtich/wikidata-taxonomy)
[![npm version](http://img.shields.io/npm/v/wikidata-taxonomy.svg?style=flat)](https://www.npmjs.org/package/wikidata-taxonomy)
[![Documentation Status](https://readthedocs.org/projects/wdtaxonomy/badge/?version=latest)](http://wdtaxonomy.readthedocs.io/en/latest/?badge=latest)

**This document**

* [at GitHub](https://github.com/nichtich/wikidata-taxonomy/blob/master/README.md)
* [at npmjs](https://www.npmjs.com/package/wikidata-taxonomy)
* [at Read the Docs](https://wdtaxonomy.readthedocs.io/en/latest/)

**Related tools**

* [wikidata-sdk](https://npmjs.com/package/wikidata-sdk) is used by this module
* [wikidata-cli] provide more generic command line tools for Wikidata
* [taxonomy browser](http://sergestratan.bitbucket.org/) is a web application
  based on Wikidata dumps

[wikidata-cli]: https://npmjs.com/package/wikidata-cli

**Publications**

* Jakob Voß (2016): *Classification of Knowledge Organization Systems with Wikidata*. CEUR Workshop Proceedings 1676. <http://ceur-ws.org/Vol-1676/paper2.pdf> (=[Q27261879])


[P1628]: http://www.wikidata.org/entity/P1628
[P1647]: http://www.wikidata.org/entity/P1647
[P1696]: http://www.wikidata.org/entity/P1696
[P1709]: http://www.wikidata.org/entity/P1709
[P171]: http://www.wikidata.org/entity/P171
[P2235]: http://www.wikidata.org/entity/P2235
[P2236]: http://www.wikidata.org/entity/P2236
[P27]: http://www.wikidata.org/entity/P27
[P279]: http://www.wikidata.org/entity/P279
[P2888]: http://www.wikidata.org/entity/P2888
[P31]: http://www.wikidata.org/entity/P31
[P361]: http://www.wikidata.org/entity/P361
[P3950]: http://www.wikidata.org/entity/P3950
[P463]: http://www.wikidata.org/entity/P463
[P527]: http://www.wikidata.org/entity/P527
[P856]: http://www.wikidata.org/entity/P856
[Q111]: http://www.wikidata.org/entity/Q111
[Q128207]: http://www.wikidata.org/entity/Q128207
[Q17362350]: http://www.wikidata.org/entity/Q17362350
[Q193]: http://www.wikidata.org/entity/Q193
[Q2]: http://www.wikidata.org/entity/Q2
[Q205901]: http://www.wikidata.org/entity/Q205901
[Q21502402]: http://www.wikidata.org/entity/Q21502402
[Q27261879]: http://www.wikidata.org/entity/Q27261879
[Q30014]: http://www.wikidata.org/entity/Q30014
[Q30249126]: http://www.wikidata.org/entity/Q30249126
[Q308]: http://www.wikidata.org/entity/Q308
[Q313]: http://www.wikidata.org/entity/Q313
[Q319]: http://www.wikidata.org/entity/Q319
[Q324]: http://www.wikidata.org/entity/Q324
[Q327757]: http://www.wikidata.org/entity/Q327757
[Q332]: http://www.wikidata.org/entity/Q332
[Q33767]: http://www.wikidata.org/entity/Q33767
[Q3504248]: http://www.wikidata.org/entity/Q3504248
[Q370]: http://www.wikidata.org/entity/Q370
[Q44559]: http://www.wikidata.org/entity/Q44559
[Q458]: http://www.wikidata.org/entity/Q458
[Q634]: http://www.wikidata.org/entity/Q634
[Q7377]: http://www.wikidata.org/entity/Q7377
