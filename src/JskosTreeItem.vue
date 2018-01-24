<template>
  <div>
    <jskos-item v-bind="fullConcept"></jskos-item>
    <ul v-if="(fullConcept.subjectOf||[]).length || (fullConcept.narrower||[]).length">
      <li v-for="instance in fullConcept.subjectOf" class="instance">
        <jskos-item v-bind="expandConcept(instance)"></jskos-item>
      </li>
      <li v-for="child in fullConcept.narrower">
        <jskos-tree-item :conceptIndex="conceptIndex" :concept="child"></jskos-tree-item>
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
      expandConcept: function(concept) {
        return this.conceptIndex[concept.uri] || concept
      }
    },
    computed: {
      fullConcept: function() {
        return this.expandConcept(this.concept)
      }
    }
  }
</script>
