<template>
  <dl class="row">
    <dt class="col-sm-2" v-if="modified">modified</dt>
    <dd class="col-sm-10" v-if="modified">{{modified}}</dd>
    <dt class="col-sm-2" v-if="(license||[]).length">license</dt>
    <dd class="col-sm-10" v-if="(license||[]).length">
      <jskos-item v-bind="license[0]"></jskos-item>
    </dd>
  </dl>
</template>

<script>
  import JskosItem from "./JskosItem.vue"

  export default {
    components: {
      JskosItem
    },
  	name: "taxonomy-metadata",
    props: ['modified', 'license']
}
</script>
