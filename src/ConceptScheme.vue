<template>
  <div>
    <!--License: {{ license }}<br-->
    <span v-if="modified">modified: {{modified}}</span>
    <!--span v-if="(languages || []).length">language:
      <ul class="list-inline">
        <li v-for="language in languages" class="list-inline-item">{{language}}</li>
      </ul>
    </span-->
  </div>
</template>

<script>
module.exports = {

  props: ['altLabel','changeNote','contributor','created','creator','definition','depiction','editorialNote','example','hiddenLabel','historyNote','identifier','issued','modified','notation','partOf prefLabel','publisher','scopeNote','subjectOf','subject','type','uri','topConcepts','versionOf','concepts','types','extent','languages','license'],
}
</script>
