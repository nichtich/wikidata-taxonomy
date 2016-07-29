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
instance extract a taxonomy of bridges ([Q12280](https://www.wikidata.org/wiki/Q12280):

```sh
$ wdtaxonomy Q12280 
```

The output is a CSV format based on statements using the subclass-of property
([P279](https://www.wikidata.org/wiki/Property:P279)).

* **level** in the hierarchy indicated by zero or more `*` (default) or `+` 
  characters (multihierarchy).
* **id** of the item
* **label** of the item. Language can be selected with option `--language`.
  The character `,` in labels is replaces by a whitespace.
* **sites**: number of connected sites (Wikipedia and related project editions).
  Larger numbers may indicate more established concepts.
* **parents** outside of the hierarchy, indicated by zero or more `^` characters

## See Also

* [wikidata-cli](https://npmjs.com/package/wikidata-cli) provide more generic
  command line tools for Wikidata
