var expect = require('chai').expect;
var path   = require('path');
var exec   = require('child_process').execFile;

function run(args, callback) {
  exec('../wdtaxonomy.js', args, callback) 
}

describe('test output', () => {
  it('should print help by default', () => {
	run([], function(err, stdout, stderr) {
	  expect(stdout).to.match(/Usage: wdtaxonomy/m);
      done()
    });
  })
  it('should print SPARQL with option --sparql', () => {
	run(['--sparql','Q1'], function(err, stdout, stderr) {
	  expect(stdout).to.match(/SELECT.*wd:Q1/m);
      done()
    });
  })
});
