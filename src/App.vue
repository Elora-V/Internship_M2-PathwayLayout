<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json" label="File input" v-on:change="loadFile" />
  <NetworkComponent 
    v-on:contextmenu.prevent
    :network="network"
    :graphStyleProperties="networkStyle"
    @nodeRightClickEvent="openContextMenu"
  ></NetworkComponent>
  <ContextMenu
    v-if="menuProps.showMenu"
      :actions="menuProps.contextMenuActions"
      @action-clicked="UseContextMenu.handleActionClick"
      @closeMenu="UseContextMenu.closeContextMenu"
      :x="menuProps.menuX"
      :y="menuProps.menuY"
  ></ContextMenu>
</template>

<script setup lang="ts">
/**
 * Futur développement !!! /!\
 * Penser à retirer les événements lorsqu'on détruit un objet (unMount)
 * removeEventListener -> événements garder en mémoire même après destruction de l'objet donc à retirer manuellement
 */// Import -----------------
  // Utils ----------------
import { ref, reactive, onMounted } from "vue";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { method_to_try } from './composables/methode_to_try';
import { dagreLayout, vizLayout } from './composables/useLayout';
import { removeSideCompounds } from "./composables/removeSideCompounds";
import {duplicateReversibleReactions} from "./composables/duplicateReversibleReactions"
import { initZoom, rescale } from "@metabohub/viz-core";
import { importNetworkFromFile, importNetworkFromURL } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import { removeThisNode,duplicateThisNode} from "@metabohub/viz-core";
// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";


// Variables --------------
const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({nodeStyles: {}, linkStyles: {}});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeNode},{label:'Duplicate', action:duplicateNode}])
let undoFunction: any = reactive({});

// Functions --------------

function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files as FileList;
  const file = files[0];  
  importNetworkFromFile(file, network, networkStyle, callbackFunction);
}

async function callbackFunction() {
  rescale(svgProperties);

  removeSideCompounds(network.value);
  duplicateReversibleReactions(network.value);

  window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          dagreLayout(network.value);
          console.log(network.value);
        } else if (event.key === 'ArrowRight') {
          vizLayout(network.value);
          console.log(network.value);
        }
      });
}

onMounted(() => {
  svgProperties = initZoom();
  importNetworkFromURL('/Alanine_and_aspartate_metabolism.json', network, networkStyle, callbackFunction); 
});
function removeNode() {
  removeThisNode(menuProps.targetElement, network.value);
}
function duplicateNode() {
  duplicateThisNode(menuProps.targetElement, network.value, networkStyle.value);
}
function openContextMenu(Event: MouseEvent, nodeId: string) {
  UseContextMenu.showContextMenu(Event, nodeId);
}
</script><style>
@import "@metabohub/viz-core/dist/style.css";
@import "@metabohub/viz-context-menu/dist/style.css"; 
</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork