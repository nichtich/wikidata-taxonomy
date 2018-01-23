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

    <b-container fluid>
      <b-row>
        <b-col v-if="taxonomy">
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
        <b-col v-else-if="id && !waiting">
          <div class="alert alert-primary" role="alert">
            Wikidata entity with ID {{id}} not found (or there was an error)!
          </div>
        </b-col>
        <b-col v-else>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">
                Welcome to the wikidata-taxonomy web application
              </h5>
              <p>
                Please provide the identifier of a Wikidata root item or property!
              </p>
              <p>Examples:</p>
              <ul>
                <li><a href="?id=Q17362350">planet of the solar system</a></li>
                <!--li><a href="?id=P170">creator types</a> (Wikidata properties)</li-->
                <li><a href="?id=Q732577">publication types</a> (long list, takes a moment)</li>
              </ul>
              <p>
                Extended functionality is available via the 
                <a href="https://wdtaxonomy.readthedocs.io/en/latest/">wikidata-taxonomy command line client</a>.
              </p>
            </div>
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
      this.waiting = true
      wdt.queryTaxonomy(id)
      .then(function(taxonomy) {
        vm.taxonomy = taxonomy
      })
      .catch(e => {
        console.error(e)
        vm.taxonomy = undefined
      })
      .finally( (x) => {
        this.waiting = false
        vm.$forceUpdate()
        console.log(vm.taxonomy)
      })
    }
  },  
}
</script>
