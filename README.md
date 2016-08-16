# Wikidata-Taxonomy

[![build status](https://api.travis-ci.org/nichtich/wikidata-taxonomy.svg?branch=master)](http://travis-ci.org/nichtich/wikidata-taxonomy)
[![npm version](http://img.shields.io/npm/v/wikidata-taxonomy.svg?style=flat)](https://www.npmjs.org/package/wikidata-taxonomy)

Command-line tool to extract taxonomies from [wikidata](https://wikidata.org).

![](https://github.com/nichtich/wikidata-taxonomy/raw/master/wdtaxonomy-example.png)

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

The first arguments needs to be a Wikidata identifier to be used as root. For instance extract a taxonomy of planets ([Q634](https://www.wikidata.org/wiki/Q634)):

```sh
$ wdtaxonomy Q634
```

The extracted taxonomy is based on statements using the property "subclass of" ([P279](https://www.wikidata.org/wiki/Property:P279)) or "subproperty of" ([P1647](https://www.wikidata.org/wiki/Property:P1647)) and additional statistics.  Option `--sparql` prints the SPARQL queries that are used.

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

Option `--format json` enables JSON output instead of CSV. The JSON object has
four fields "`items`", "`narrower`", "`broader`", and "`root`".

## See Also

* [wikidata-sdk](https://npmjs.com/package/wikidata-sdk) is used by this module
* [wikidata-cli](https://npmjs.com/package/wikidata-cli) provide more generic
  command line tools for Wikidata
* [taxonomy browser](http://sergestratan.bitbucket.org/) is a web application
  based on Wikidata dumps
