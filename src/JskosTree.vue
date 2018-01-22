<template>
  <div>
    <ul v-if="(topConcepts||[]).length" class="jskos-tree jskos-tree-root">
      <li v-for="concept in topConcepts">
        <jskos-tree-item :conceptIndex="conceptIndex" :concept="concept"></jskos-tree-item>
      </li>
    </ul>
  </div>
</template>

<script>
  import JskosTreeItem from "./JskosTreeItem.vue"

  export default {
    components: {
      JskosTreeItem
    },
  	name: 'jskos-tree',

    props: ['topConcepts', 'concepts'],

    methods: {
      concept: function(concept) {
        return this.conceptIndex[concept.uri] || concept
      }
    },

    computed: {
      conceptIndex: function() {
        return (this.concepts || []).reduce( 
          (index, cur) => {
            if (cur.uri) index[cur.uri] = cur
            return index
          }, {}
        )
      }
    }
  }
</script>
