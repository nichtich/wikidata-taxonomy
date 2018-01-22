<template>
  <div>
    <jskos-item v-bind="fullConcept(concept)"></jskos-item>
    <ul v-if="(fullConcept(concept).narrower||[]).length">
      <li v-for="child in fullConcept(concept).narrower">
        <jskos-tree-item :conceptIndex="conceptIndex" :concept="fullConcept(child)"></jskos-tree-item>
      </li>
    </ul>
  </div>
</template>

<script>
  import JskosItem from "./JskosItem.vue"

  export default {
    components: {
      JskosItem
    },
  	name: 'jskos-tree-item',
    props: ['concept', 'conceptIndex'],
    methods: {
      fullConcept: function(concept) {
        return this.conceptIndex[concept.uri] || concept
      }
    },
  }
</script>
