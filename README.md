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

    -b, --brief                          don't count instance and sites
    -c, --children                       get direct subclasses only
    -d, --descr                          include item descriptions
    -e, --endpoint <url>                 SPARQL endpoint to query
    -f, --format <tree|csv|json|ndjson>  output format
    -h, --help                           output usage information
    -i, --instances                      include instances (tree format)
    -l, --language <code>                language to get labels in
    -n, --no-colors                      disable color output
    -o, --output <file>                  write result to a file
    -P, --property <id>                  hierarchy property (e.g. P279)
    -p, --post                           use HTTP POST to disable caching
    -r, --reverse                        get superclasses instead
    -s, --sparql                         print SPARQL query and exit
    -t, --total                          count total number of instances
    -u, --user <name>                    user to the SPARQL endpoint
    -v, --verbose                        show verbose error messages
    -V, --version                        output the version number
    -w, --password <string>              password to the SPARQL endpoint
```

The first arguments needs to be a Wikidata identifier to be used as root of the taxonomy. For instance extract a taxonomy of planets ([Q634](https://www.wikidata.org/wiki/Q634)):

```sh
$ wdtaxonomy Q634
```

The extracted taxonomy is based on statements using the property "subclass of" ([P279](https://www.wikidata.org/wiki/Property:P279)) or "subproperty of" ([P1647](https://www.wikidata.org/wiki/Property:P1647)) and additional statistics.  Option `--sparql` prints the SPARQL queries that are used.

Taxonomy extraction and output can be controlled by several [options](#options). For
instance this command lists a biological taxonomy of mammals:

    $ wdtaxonomy.js Q7377 --property P171 --brief

## Options

### Query options

#### brief (`-b`)

Don't count instance and sites

#### children (`-c`)

Get direct subclasses only

#### descr (`-d`)

Include item descriptions

#### endpoint (`-e`)

SPARQL endpoint to query (default: <https://query.wikidata.org/sparql>)

#### instances (`-i`)

include instances (tree format)

#### language (`-l`)

language to get labels in (default: `en`)

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

disable color output

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
├──outer planet (Q30014) •23 ×4 ↑
└──inner planets (Q3504248) •8 ×4 ↑
```

The output contains item labels, Wikidata identifiers, the number of
Wikimedia sites connected to each item (indicated by bullet character "`•`"),
the number of instances ([property P31](https://www.wikidata.org/wiki/P31),
indicated by a multiplication sign "`×`"), and an upwards arrow ("`↑`") as
indicator for additional superclass not included in the tree.

Option "`--instances`" (or "`-i`") explicitly includes instances:

```sh
$ wdtaxonomy -i Q17362350
```
```
planet of the Solar System (Q17362350) •2 ↑
├──outer planet (Q30014) •23 ↑
|   -Saturn (Q193)
|   -Jupiter (Q319)
|   -Uranus (Q324)
|   -Neptune (Q332)
└──inner planets (Q3504248) •8 ↑
    -Earth (Q2)
    -Mars (Q111)
    -Mercury (Q308)
    -Venus (Q313)
```

Classes that occur at multiple places in the taxonomy (multihierarchy) are
marked like in the following example:

```sh
$ wdtaxonomy Q634
```
```
planet (Q634) •196 ×7 ↑
├──extrasolar planet (Q44559) •81 ×833 ↑
|  ├──circumbinary planet (Q205901) •14 ×10
|  ├──super-Earth (Q327757) •32 ×46
...
├──terrestrial planet (Q128207) •67 ×7
|  ╞══super-Earth (Q327757) •32 ×46  …
...
```

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

For instance the CSV output for [Q634](https://www.wikidata.org/wiki/Q634)
would be like this:

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

In this example there are 196 Wikipedia editions or other sites with an
article about planets and seven Wikidata items are direct instance of a
planet. At the end of the line "`^`" indicates that "planet" has one
superclass. In the next rows "extrasolar planet"
([Q44559](https://www.wikidata.org/wiki/Q44559)) is a subclass of planet with
another superclass indicated by "`^`". Both "circumbinary planet" and
"super-Earth" are subclasses of "extrasolar planet". The latter also occurs as
subclass of "terrestrial planet" where it is marked by "`==`" instead of
"`--`".

### JSON format

Option `--format json` serializes the taxonomy as JSON object with the following fields:

* root: Wikidata identifier of the root item/property
* items: object with Wikidata items/properties, indexed by their identifier
* narrower
* broader
* instances (if option `instances` is enabled)

*This format may change in a future version!*

## NDJSON format

Option `--format ndjson` serializes the taxonomy in JSKOS format with one record per line.

## Specialized taxonomies

The hierarchy properties [P279](http://www.wikidata.org/entity/P279) ("subclass
of") and [P31](http://www.wikidata.org/entity/P31) ("instance of") to build
taxonomies from can be changed with option `property` (`-P`).

*Members of (P463) the European Union (Q458):*

    $ wdtaxonomy Q458 -P P463

*Members of (P463) the European Union (Q458) and number of its citizens in
Wikidata (P27):*

    $ wdtaxonomy Q458 -P 463/27

As Wikidata is no strict ontology, subproperties are not factored in. For
instance this query does not include members of the European Union although
P463 is a subproperty of P361.

*Parts of (P361) the European Union (Q458):*

    $ wdtaxonomy Q458 -P P361

A taxonomy of subproperties can be queried like taxonomies of items. The
hierarchy property is set to P1647 ("subproperty of") by default:

    $ wdtaxonomy P361
    $ wdtaxonomy P361 -P P1647  # equivalent

*Subproperties of "part of" (P361) and which of them have an inverse property
(P1696):*

    $ wdtaxonomy P361 -P P1647/P1696

Inverse properties are neither factored in so queries like these do not
necesarrily return the same results:

*What hand (Q33767) is part of (P361):*

    $ wdtaxonomy Q33767 -P 361 -r

*What parts the hand (Q33767) has (P527):*

    $ wdtaxonomy Q33767 -P 527

## Release notes

Release notes are listed in file [CHANGES.md](https://github.com/nichtich/wikidata-taxonomy/blob/master/CHANGES.md#changelog) in the source code repository.

## See Also

[![build status](https://api.travis-ci.org/nichtich/wikidata-taxonomy.svg?branch=master)](http://travis-ci.org/nichtich/wikidata-taxonomy)
[![npm version](http://img.shields.io/npm/v/wikidata-taxonomy.svg?style=flat)](https://www.npmjs.org/package/wikidata-taxonomy)
[![Documentation Status](https://readthedocs.org/projects/wdtaxonomy/badge/?version=latest)](http://wdtaxonomy.readthedocs.io/en/latest/?badge=latest)

This document

* [at GitHub](https://github.com/nichtich/wikidata-taxonomy/blob/master/README.md)
* [at npmjs](https://www.npmjs.com/package/wikidata-taxonomy)
* [at Read the Docs](https://wdtaxonomy.readthedocs.io/en/latest/)

Related tools

* [wikidata-sdk](https://npmjs.com/package/wikidata-sdk) is used by this module
* [wikidata-cli](https://npmjs.com/package/wikidata-cli) provide more generic
  command line tools for Wikidata
* [taxonomy browser](http://sergestratan.bitbucket.org/) is a web application
  based on Wikidata dumps
