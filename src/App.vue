<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json" label="File input" v-on:change="loadFile" />
  <br>
  <button v-on:click="newCluster()">
     New_Cluster
  </button>
  <br>
  <button v-on:click="ordering('default')">
     Ordering default
  </button>
  <br>
  <button v-on:click="ordering('out')">
     Ordering out
  </button>
  <br>
  <button v-on:click="ordering('in')">
     Ordering in
  </button>
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
import { Serialized } from "graph-data-structure";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { dagreLayout, vizLayout } from './composables/useLayout';
import { removeSideCompounds } from "./composables/removeSideCompounds";
import {duplicateReversibleReactions} from "./composables/duplicateReversibleReactions"
import {importNetworkFromFile,importNetworkFromURL} from "./composables/importNetwork"
import { NetworkToSerialized } from "@/composables/networkToGraph";
import { initZoom, rescale } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import { removeThisNode,duplicateThisNode} from "@metabohub/viz-core";
// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";
import { node } from "prop-types";
import { Cluster } from "@/types/Cluster";
import { ClusterNetwork } from "@/types/ClusterNetwork";




// Variables --------------
const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({nodeStyles: {}, linkStyles: {}});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeNode},{label:'Duplicate', action:duplicateNode},{label:'AddToCluster', action:addToCluster}])
let undoFunction: any = reactive({});
//let clusters : Array<Cluster> =reactive([])
//let attributGraphViz : AttributesViz=reactive({});
let clusterNetwork:ClusterNetwork={network:network,attributs:{},clusters:{}};

// Functions --------------

function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files as FileList;
  const file = files[0];  
  importNetworkFromFile(file, network, networkStyle, callbackFunction);
}


async function callbackFunction() {
  rescale(svgProperties);

  console.log('________New_graph__________');
  removeSideCompounds(network.value,"/sideCompounds.txt");
  console.log(network.value);

  // import('graph-data-structure').then(gds => {
  //   const graph = gds.Graph();
  //   const networkSerialized: Serialized = NetworkToSerialized(network.value);
  //   graph.deserialize(networkSerialized);
  // })

}

function keydownHandler(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    dagreLayout(network.value,{}, rescaleAfterAction);
  } else if (event.key === 'ArrowRight') {
    vizLayout(network.value, clusterNetwork.clusters ,clusterNetwork.attributs ,rescaleAfterAction);
  } else if (event.key === "d") {
    duplicateReversibleReactions(network.value);
  } else if (event.key =="c"){
    console.log(clusterNetwork);
  } else if (event.key =="n"){
    console.log(network.value);
  }
}

function rescaleAfterAction(){
  console.log('Rescaling');
  rescale(svgProperties);
}

onMounted(() => {
  svgProperties = initZoom();
  clusterNetwork.attributs={rankdir: "BT" , newrank:true, compound:true};
  window.addEventListener('keydown', keydownHandler);
  importNetworkFromURL('/pathways/Alanine_and_aspartate_metabolism.json', network, networkStyle, callbackFunction); 
  
});
function removeNode() {
  removeThisNode(menuProps.targetElement, network.value);
}
function duplicateNode() {
  duplicateThisNode(menuProps.targetElement, network.value, networkStyle.value);
}

function newCluster(){
  const numberCluster=Object.keys(clusterNetwork.clusters).length;
  const cluster=new Cluster(String(numberCluster));
  clusterNetwork.clusters[cluster.name]=cluster;
}

function addToCluster() {
  let numberCluster=Object.keys(clusterNetwork.clusters).length;
  if (numberCluster === 0){
    newCluster();
    numberCluster+=1;
  }
  clusterNetwork.clusters[String(numberCluster-1)].addNode(menuProps.targetElement); 
}

function ordering(value:string="default"){
  if (!clusterNetwork.attributs){
    clusterNetwork.attributs={};
  }
  if (value == "default" && "ordering" in clusterNetwork.attributs){
    delete clusterNetwork.attributs.ordering;
  } else if (value == "in" || value == "out"){
    clusterNetwork.attributs.ordering=value;
  }
}

function openContextMenu(Event: MouseEvent, nodeId: string) {
  UseContextMenu.showContextMenu(Event, nodeId);
}
</script><style>
@import "@metabohub/viz-core/dist/style.css";
@import "@metabohub/viz-context-menu/dist/style.css"; 
</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork