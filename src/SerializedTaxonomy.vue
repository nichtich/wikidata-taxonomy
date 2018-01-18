<template>
  <pre class="bg-dark"><code v-html="serialized"></code></pre>
</template>

<script>
function escapeHTML(unsafeText) {
  var div = document.createElement('div');
  div.innerText = unsafeText;
  return div.innerHTML;
}

module.exports = {
  props: ['taxonomy'],
  computed: {
    serialized() {
      // TODO: move to wikidata-taxonomy
      var serialized = ''
      var stream = {
        write(data) {
          serialized += data
          console.log("OK")
        }
      } 
      var col = (c) => (
        (s) => '<span class="'+c+'">'+escapeHTML(s)+'</span>'
      )
      // TODO: rename chalk to colors
      options = {
        chalk: {
          delimiter: col('text-secondary'),
          green: col('text-success'),
          white: col('text-white'),
          cyan: col('text-info'),
          yellow: col('text-warning'),
          red: col('text-danger'),
        }
      }
      wdt.serializeTaxonomy.txt(this.taxonomy, stream, options)
      return serialized
    }
  }
}
</script>
