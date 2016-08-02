# Wikidata-Taxonomy

[![build status](https://api.travis-ci.org/nichtich/wikidata-taxonomy.svg?branch=master)](http://travis-ci.org/nichtich/wikidata-taxonomy)
[![npm version](http://img.shields.io/npm/v/wikidata-taxonomy.svg?style=flat)](https://www.npmjs.org/package/wikidata-taxonomy)

Command-line tool to extract taxonomies from [wikidata](https://wikidata.org).

## Dependencies

* [NodeJs](https://nodejs.org) (at least version 4)

## Installation

Install globally to make command `wdtaxonomy` accessible from your shell `$PATH`:

```sh
$ npm install -g wikidata-taxonomy
```

## Usage

This module provides the command `wdtaxonomy`. By default, a usage help is printed: 

```sh
$ wdtaxonomy
```

The first arguments needs to be a Wikidata identifier to be used as root. For
instance extract a taxonomy of planets ([Q634](https://www.wikidata.org/wiki/Q634)):

```sh
$ wdtaxonomy Q634
```

The extracted taxonomy is based on statements using the subclass-of property
([P279](https://www.wikidata.org/wiki/Property:P279)) and additional statistics.
Option `--sparql` print the SPARQL query that is used.

### Tree format

By default, the taxonomy is printed as tree with Unicode characters.

```sh
$ wdtaxonomy Q620207
```
```
finger (Q620207) •46 ^
├──thumb (Q83360) •76 
├──middle finger (Q167131) •60 
├──index finger (Q184848) •57 
├──ring finger (Q192298) •51 
└──little finger (Q228027) •55 
```

The output contains item labels, Wikidata identifiers, and the number of
Wikimedia sites conneted to each item (indicated by bullet character "`•`"). A
more complex example (abbreviated below) includes additional information:

```sh
$ wdtaxonomy Q634
```
```
planet (Q634) •196 ×7 ^
├──extrasolar planet (Q44559) •81 ×833 ^
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

For instance the CSV output for [Q634](https://www.wikidata.org/wiki/Q634) would be
like this:

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
about planets and seven Wikidata items are direct instance of
([P31](https://www.wikidata.org/wiki/P31)) a planet. At the end of the line
"`^`" indicates that "planet" has one superclass. In the next rows "extrasolar
planet" ([Q44559](https://www.wikidata.org/wiki/Q44559)) is a subclass of planet
with another superclass indicated by "`^`". Both "circumbinary planet" and
"super-Earth" are subclasses of "extrasolar planet". The latter also occurs as
sublass of "terrestrial planet" where it is marked by "`==`" instead of "`--`".

### JSON format

Option `--format json` enables JSON output instead of CSV. The JSON object has
four fields "`items`", "`narrower`", "`broader`", and "`root`".

## See Also

* [wikidata-cli](https://npmjs.com/package/wikidata-cli) provide more generic
  command line tools for Wikidata
* [taxonomy browser](http://sergestratan.bitbucket.org/) is a web application
  based on Wikidata dumps
