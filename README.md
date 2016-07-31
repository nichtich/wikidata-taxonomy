# Wikidata-Taxonomy

Command-line tool to extract taxonomies from [wikidata](https://wikidata.org).

## Dependencies

* [NodeJs](https://nodejs.org)

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

### CSV output

The default output is a CSV format optimized for comparing differences in time.
Each output row consists of five fields:

* **level** in the hierarchy indicated by zero or more "`*`" (default) or "`+`" 
  characters (multihierarchy).

* **id** of the item. Items on the same level are sorted by their id.

* **label** of the item. Language can be selected with option `--language`.
  The character `,` in labels is replaces by a whitespace.

* **sites**: number of connected sites (Wikipedia and related project editions).
  Larger numbers may indicate more established concepts.

* **parents** outside of the hierarchy, indicated by zero or more "`^`" characters.

For instance the CSV output for [Q634](https://www.wikidata.org/wiki/Q634) would be
like this:

```csv
level,id,label,sites,instances,parents
,Q634,planet,196,7,^
*,Q44559,extrasolar planet,81,832,^
**,Q205901,circumbinary planet,14,10,
**,Q327757,super-Earth,32,46,
...
*,Q128207,terrestrial planet,67,7,
++,Q327757,super-Earth,32,46,
...

```

In this example there are 196 Wikipedia editions or other sites with an article
about planets and seven Wikidata items are direct instance of
([P31](https://www.wikidata.org/wiki/P31)) a planet. At the end of the line
"`^`" indicates that "planet" has one superclass. In the next rows "extrasolar
planet" ([Q44559](https://www.wikidata.org/wiki/Q44559)) is a subclass of planet
with another superclass indicated by "`^`". Both "circumbinary planet" and
"super-Earth" are subclasses of "extrasolar planet". The latter also occurs as
sublass of "terrestrial planet" where it is marked by "`++`" instead of "`**`".

### JSON output

Option `--format json` enables JSON output instead of CSV. The JSON object has
three fields "`items`", "`edges`", and "`root`".

## See Also

* [wikidata-cli](https://npmjs.com/package/wikidata-cli) provide more generic
  command line tools for Wikidata
