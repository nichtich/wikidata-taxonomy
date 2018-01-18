# Changelog

This changelog tracks features and fixes of [wikidata-taxonomy](https://www.npmjs.com/package/wikidata-taxonomy).

# 0.6.6 (2017-01-18)

* Add browserify distribution
* Extend documentation

# 0.6.5 (2017-01-09)

* Update dependencies

# 0.6.3 (2017-12-20)

* Quote label in CSV and add TSV format (#38)

# 0.6.3 (2017-12-02)

* Add option `--prune/-R` to prune hierarchies

# 0.6.2 (2017-11-28)

* Fix duplicated items and mappings (#36)

# 0.6.1 (2017-11-28)

* Fix field `concepts` in json output (from object to array)
* Rename default `tree` format to `txt`.
* Add experimental `wdmappings` tool (not documented yet)

# 0.6.0 (2017-11-15)

* Express number of instances and sites as JSKOS Concept Occurrences.
* Include instances in CSV format
* Add option `--no-labels/-L` to omit labels (#30)
* Add option `--json/-j` as alias to `--format json`

# 0.5.4 (2017-11-12)

* Add options `--no-instancecount` and `--no-sitecount`
* Add option `--uris` / `-U` to show full URIs (#28)
* Add option shortcut `-C` for `--color`
* Rename option `-e` and `-l` long names equal to wikidata-cli
* Colorize CSV format
* Fix bug in CSV output (#29)

# 0.5.1 (2017-11-07)

* Use JSKOS as JSON output format (#25)
* Include mapping types (#26)

# 0.5.0 (2017-11-05)

* Support multiple mapping properties, including shortcuts (#23)
* Start to align internal JSON format to JSKOS (#25)
* Multi-hierarchy-indicator in CSV and tree output now includes all broader items

# 0.4.2 (2017-10-28)

* Add option to include mappings (expect in CSV output)
* Fix CSV output (again)

# 0.4.2 (2017-09-20)

* Fix CSV output

# 0.4.1 (2017-09-20)

* Refactor to be used as node and browserify module
* Limit NDJSON to classes (#14)
* Raise requirement to node 6 

## 0.3.3 (2017-08-19)

* Add option `--descr` to include item descriptions
* Add options to specify the query endpoint

## 0.3.2 (2017-03-06)

* Fix option `--total`

## 0.3.1 (2017-03-04)

* Fix inclusion of number of sites
* Add option `--property` to query other kinds of taxonomies
  such as partitive, biological etc.

## 0.3.0 (2017-03-02)

* Add JSKOS output format (`ndjson`)
* Add option `--total` to count total/transitive number of instances
* Add option `--brief` to omit number of sites and instance
* Add option `--verbose` to enable verbose error message

## 0.2.10 (2017-02-27)

* Change label color to white (#7)
* Add option `--post` to disable caching

## 0.2.9 (2017-09-16)

* New option `--children` to only get direct subclasses
* More more liberal identifier parsing

## 0.2.8 (2017-09-13)

* More liberal identifier parsing
* Count instances also in reverse mode

## 0.2.7 (2017-08-21)

* Detect when an instance was queried
* Detect non-existing items or properties

## 0.2.6 (2017-08-19)

* New option `--output` for output file

## 0.2.5 (2017-08-16)

* Support retrieval of property hierarchies

## 0.2.4 (2017-08-12)

* New option `--reverse` to show superclasses 
* Improved tree format

## 0.2.3 (2017-08-06)

* Increased dependency on wikidata-sdk

## 0.2.2 (2016-08-03)

* Improve tree format
* New option `--no-colors` to disable colors 

## 0.2.1 (2016-08-03)

* New option `--instances` to include instances
* Added color output

## 0.2.0 (2016-08-01)

* Make tree format the default
* Modify CSV format

## 0.1.1 (2016-07-31)

* New options `--json` and `--sparql`

## 0.0.1 (2016-07-29)

* First release, ported from a Perl script: from the frying pan into the fire

