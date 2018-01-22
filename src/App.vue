<template>
  <div>
    <b-navbar toggleable="md" type="light" variant="light">
      <b-navbar-nav>
        <b-nav-form @submit.prevent="submit">
          <b-form-input size="sm" class="mr-sm-2" type="text" name="id" v-model="id" placeholder="Root Item"/>
        </b-nav-form>
      </b-navbar-nav>

      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
        <b-collapse is-nav id="nav_collapse">

          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown text="wikidata-taxonomy" right>
              <b-dropdown-item href="https://github.com/nichtich/wikidata-taxonomy">source code</b-dropdown-item>
              <b-dropdown-item href="https://wdtaxonomy.readthedocs.io/en/latest/">documentation</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>

        </b-collapse>
      </b-navbar>

      <b-container fluid v-if="taxonomy">
        <b-row>
          <b-col>
            <b-tabs>
              <b-tab title="tree" href="#tree" active>
                <jskos-tree v-bind="taxonomy"></jskos-tree>
              </b-tab>
              <b-tab title="text" href="#text">
                <serialized-taxonomy :taxonomy="taxonomy"></serialized-taxonomy>
              </b-tab>
              <b-tab title="data" href="#data">
                <tree-view :data="taxonomy"></tree-view>
              </b-tab>
              <b-tab title="about" href="#about">
                <taxonomy-metadata v-bind="taxonomy"></taxonomy-metadata>
              </b-tab>
            </b-tabs>  
          </b-col>
        </b-row>
      </b-container>

      <b-container fluid v-else>
        <b-row>
          <b-col>
            <div class="alert alert-primary" role="alert">
              Wikidata entity with ID {{id}} not found (or there was an error)!
            </div>
          </b-col>
        </b-row>
      </b-container>

  </div>
</template>

<script>
import JskosTree from './JskosTree.vue'
import TaxonomyMetadata from './TaxonomyMetadata.vue'
import SerializedTaxonomy from './SerializedTaxonomy.vue'
import TreeView from "vue-json-tree-view"

Vue.use(TreeView)

export default {
  components: {
    JskosTree,
    TaxonomyMetadata,
    SerializedTaxonomy
  },
  created: function () { 
    this.id = this.$route.query.id
    this.query()
  },
  methods: {
    submit: function () {
      this.$router.push({query:{id: this.id}})
      this.query()
    },
    query: function () {
      const id = this.id
      const vm = this
      console.log("$ wdtaxonomy "+id)
      if (id === undefined || id === '') return

      wdt.queryTaxonomy(id)
      .then(function(taxonomy) {
        vm.taxonomy = taxonomy
      })
      .catch(e => {
        console.error(e)
        vm.taxonomy = undefined
      })
      .finally( (x) => {
        vm.$forceUpdate()
        console.log(vm.taxonomy)
      })
    }
  },  
}
</script>
