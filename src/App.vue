<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json" label="File input" v-on:change="loadFile" />
  <NetworkComponent
    v-on:contextmenu.prevent
    :network="network"
    :graphStyleProperties="networkStyle"
  ></NetworkComponent>
</template>

<script setup lang="ts">
/**
 * Futur développement !!! /!\
 * Penser à retirer les événements lorsqu'on détruit un objet (unMount)
 * removeEventListener -> événements garder en mémoire même après destruction de l'objet donc à retirer manuellement
 */// Import -----------------
  // Utils ----------------
import { ref, reactive, onMounted } from "vue";
import dagre from 'dagrejs';
import { instance } from "@viz-js/viz";
  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphViz } from './types/graphLibType';
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { method_to_try } from './composables/methode_to_try';
import { NetworkToDagre, NetworkToViz } from './composables/networkToGraph';
import { changeNetworkFromDagre, changeNetworkFromViz } from './composables/graphToNetwork';
import { initZoom, rescale } from "@metabohub/viz-core";
import { importNetworkFromFile, importNetworkFromURL } from "@metabohub/viz-core";
// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";

// Variables --------------
const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({nodeStyles: {}, linkStyles: {}});
let svgProperties = reactive({});

let undoFunction: any = reactive({});
// Functions --------------

function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files as FileList;
  const file = files[0];  
  importNetworkFromFile(file, network, networkStyle, callbackFunction);
}

function callbackFunction() {
  rescale(svgProperties);

  instance().then(viz => {
  const graph=NetworkToViz(network.value);
  const json=viz.renderJSON(graph);
  changeNetworkFromViz(json,network.value)
  })

}

onMounted(() => {
  svgProperties = initZoom();
  importNetworkFromURL('/MetExploreViz_04-03-2024.json', network, networkStyle, callbackFunction);
});

</script><style>
@import "@metabohub/viz-core/dist/style.css";
</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork