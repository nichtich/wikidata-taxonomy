<template>
  <div>
      <b-navbar toggleable="md" type="light" variant="light">
        <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
        <b-navbar-brand href="#">WDT</b-navbar-brand>
        <b-collapse is-nav id="nav_collapse">

          <b-navbar-nav>
            <b-nav-form @submit.prevent="submit">
              <b-form-input size="sm" class="mr-sm-2" type="text" name="id" v-model="id" placeholder="Root Item"/>
            </b-nav-form>
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown text="about" right>
              <b-dropdown-item href="https://github.com/nichtich/wikidata-taxonomy">source code at GitHub</b-dropdown-item>
              <b-dropdown-item href="https://wdtaxonomy.readthedocs.io/en/latest/">documentation</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>

        </b-collapse>
      </b-navbar>

      <concept-scheme v-bind="taxonomy"></concept-scheme>

  </div>
</template>

<script>
import ConceptScheme from './ConceptScheme.vue'

export default {
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
        vm.taxonomy = undefined
      })
      .finally( (x) => {
        vm.$forceUpdate()
        console.log(vm.taxonomy)
      })
    }
  },  
  components: {
    'concept-scheme': ConceptScheme
  }
}
</script>
