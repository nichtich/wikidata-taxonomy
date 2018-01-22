<template>
  <span>
    <span v-if="prefLabel && prefLabel.en">
      {{prefLabel.en}}
      <span v-if="(notation||[]).length">
        (<a :href="uri">{{notation[0]}}</a>)
      </span>
    </span>
    <span v-else-if="(notation||[]).length">
      <a :href="uri">{{notation[0]}}</a>    
    </span>
    <span v-else>
      <a :href="uri">{{uri}}</a>
    </span>
  </span>
</template>

<script>
  export default {
    name: 'jskos-item',
    props: ['prefLabel', 'notation', 'uri'],
  }
</script>
