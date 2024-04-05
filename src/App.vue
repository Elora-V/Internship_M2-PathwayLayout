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
import require from 'require.js';

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import {removeThisNode} from "@metabohub/viz-core";
  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { method_to_try } from './composables/methode_to_try';
import { dagreLayout, vizLayout } from './composables/useLayout';
import {sbml2json} from './composables/SBMLtoJSON';
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
  //const convert = require('xml-js');
  window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          dagreLayout(network.value);
        } else if (event.key === 'ArrowRight') {
          vizLayout(network.value);
        }
      });
}

onMounted(() => {
  svgProperties = initZoom();
  importNetworkFromURL('/MetExploreViz_04-03-2024.json', network, networkStyle, callbackFunction);
});

</script><style>
@import "@metabohub/viz-core/dist/style.css";
</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork