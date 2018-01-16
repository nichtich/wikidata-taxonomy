<template>
  <div>
    modified: {{ modified }} <br>
    License: {{ license }}<br>
    topConcepts: {{ topConcepts }}<br>

    <hr/>
    <ul class="list-inline" v-if="languages.length">
      <li v-for="language in languages" class="list-inline-item">{{language}}</li>
    </ul>

  </div>
</template>

<script>
module.exports = {

  props: ['altLabel','changeNote','contributor','created','creator','definition','depiction','editorialNote','example','hiddenLabel','historyNote','identifier','issued','modified','notation','partOf prefLabel','publisher','scopeNote','subjectOf','subject','type','uri','topConcepts','versionOf','concepts','types','extent','languages','license'],

}
</script>
