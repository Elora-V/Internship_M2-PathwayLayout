<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json" label="File input" v-on:change="loadFile" />
  <button v-on:click="algoForce()">
    ForceAlgo
  </button>
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
  <h5>Number of crossings in the Network : {{ countIntersection(network) }}</h5>
  <h5>Number of isolated nodes : {{ countIsolatedNodes(network) }}</h5>
  <br>
  <br>
  <button v-on:click="sourcesChoice('rank_only')">
     Rank only
  </button><br>
  <button v-on:click="sourcesChoice('rank_source')">
     Rank source
  </button><br>
  <button v-on:click="sourcesChoice('source_only')">
     Source only
  </button><br>
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
import { countIntersection } from "./composables/countIntersections";
import { countIsolatedNodes } from "./composables/countIsolatedNodes";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { dagreLayout, vizLayout } from './composables/useLayout';
import { removeSideCompounds } from "./composables/removeSideCompounds";
import {chooseReversibleReaction, duplicateReversibleReactions} from "./composables/duplicateReversibleReactions"
import {importNetworkFromFile,importNetworkFromURL} from "./composables/importNetwork"
import { NetworkToSerialized } from "@/composables/networkToGraph";
import { initZoom, rescale } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import { removeThisNode,duplicateThisNode} from "@metabohub/viz-core";
import {createCluster,addNodeCluster} from "./composables/UseClusterNetwork";
import { customDFS, DFSWithSources } from "@/composables/algoDFS";
import { createStaticForceLayout } from "@metabohub/viz-core";

// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";
import { node } from "prop-types";
import { Cluster } from "@/types/Cluster";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { SourceType } from "@/types/EnumArgs";
import { addLonguestPathClusterFromSources } from "@/composables/chooseSubgraph";
import { RefSymbol } from "@vue/reactivity";
import { BFS, BFSWithSources } from "@/composables/algoBFS";
import { getSources } from "@/composables/rankAndSources";




// Variables --------------
const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({nodeStyles: {}, linkStyles: {}});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeNode},{label:'Duplicate', action:duplicateNode},{label:'AddToCluster', action:addToCluster}])
let undoFunction: any = reactive({});
//let clusters : Array<Cluster> =reactive([])
//let attributGraphViz : AttributesViz=reactive({});
let clusterNetwork:ClusterNetwork;
let sourceTypePath:SourceType=SourceType.RANK_ONLY;

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
  clusterNetwork={network:network,attributs:{},clusters:{}};
  clusterNetwork.attributs={rankdir: "BT" , newrank:true, compound:true};
  removeSideCompounds(network.value,"/sideCompounds.txt");
  console.log(network.value);

}

function keydownHandler(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    dagreLayout(network.value,{}, rescaleAfterAction);
  } else if (event.key === 'ArrowRight') {
    vizLayout(network.value, clusterNetwork.clusters ,clusterNetwork.attributs ,true,rescaleAfterAction);
  } else if (event.key === "d") {
    duplicateReversibleReactions(network.value);
  } else if (event.key =="c"){
    console.log(clusterNetwork);
  } else if (event.key =="n"){
    console.log(network.value);
  }else if (event.key =="r"){
    chooseReversibleReaction(network.value,SourceType.RANK_SOURCE_ALL,BFSWithSources);
  }else if (event.key =="p"){
    console.log('create cluster longuest path');
    clusterNetwork=addLonguestPathClusterFromSources(clusterNetwork,SourceType.RANK_ONLY);
  } else if (event.key == "a"){
    allSteps(clusterNetwork,sourceTypePath);
  } else if (event.key == "f"){
    const sources=getSources(network.value,SourceType.RANK_ONLY);
    const {dfs,crossEdge}=customDFS(network.value,sources);
    console.log(crossEdge);
  }
  else if (event.key == "b"){
    const sources=getSources(network.value,SourceType.RANK_ONLY);
    const bfs=BFSWithSources(network.value,sources);
    bfs.forEach(node=>{
      console.log(network.value.nodes[node].label);
    })

  }
}
/**
 * rescale the network
 */
function rescaleAfterAction(){
  console.log('Rescaling');
  rescale(svgProperties);
}

async function allSteps(clusterNetwork: ClusterNetwork,sourceTypePath:SourceType=SourceType.RANK_ONLY) {

    let network=clusterNetwork.network.value;

    await vizLayout(network, clusterNetwork.clusters, clusterNetwork.attributs, true).then(
      () => {
        duplicateReversibleReactions(network);
      }
    ).then(
      () => {
        chooseReversibleReaction(network, SourceType.RANK_SOURCE_ALL,BFSWithSources);
      }
    ).then(
      () => {
        clusterNetwork = addLonguestPathClusterFromSources(clusterNetwork, sourceTypePath);
      }
    ).then(
      () => {
        vizLayout(network, clusterNetwork.clusters, clusterNetwork.attributs, false, rescaleAfterAction);
      }
    )

}

onMounted(() => {
  svgProperties = initZoom();
  window.addEventListener('keydown', keydownHandler);
  importNetworkFromURL('/pathways/Aminosugar_metabolism.json', network, networkStyle, callbackFunction); 
  
});
function removeNode() {
  removeThisNode(menuProps.targetElement, network.value);
}
function duplicateNode() {
  duplicateThisNode(menuProps.targetElement, network.value, networkStyle.value);
}

function newCluster(){
  const numberCluster=Object.keys(clusterNetwork.clusters).length;
  const cluster= createCluster(String(numberCluster));
  clusterNetwork.clusters[cluster.name]=cluster;
}

function addToCluster() {
  let numberCluster=Object.keys(clusterNetwork.clusters).length;
  if (numberCluster === 0){
    newCluster();
    numberCluster+=1;
  }
  clusterNetwork.clusters[String(numberCluster-1)]=addNodeCluster(clusterNetwork.clusters[String(numberCluster-1)],menuProps.targetElement); 
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


function sourcesChoice(sourcetype:string):void{
  if (sourcetype==SourceType.RANK_ONLY){
    sourceTypePath=SourceType.RANK_ONLY;
  }
  else if (sourcetype==SourceType.RANK_SOURCE){
    sourceTypePath=SourceType.RANK_SOURCE;
  }
  else if (sourcetype==SourceType.SOURCE_ONLY){
    sourceTypePath=SourceType.SOURCE_ONLY;
  }
  console.log(sourceTypePath);
  clusterNetwork.clusters={}; // temporaire, je reset les clusters pour pas ajouter les nouveaux aux vieux
}

function algoForce(){
  network.value=createStaticForceLayout(network.value);
}

function openContextMenu(Event: MouseEvent, nodeId: string) {
  UseContextMenu.showContextMenu(Event, nodeId);
}
</script><style>
@import "@metabohub/viz-core/dist/style.css";
@import "@metabohub/viz-context-menu/dist/style.css"; 

</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork