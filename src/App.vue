<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json, .xml" label="File input" v-on:change="loadFile" class=" margin"/>
  <button v-on:click="newCluster()" class="margin">
     New_Cluster
  </button>
  
  <button v-on:click="algoForce()" class="styled-button">
    ForceAlgo
  </button>

  <button v-on:click="getOriginalNetwork()" class="styled-button">
      originalLayout
    </button>


    <button v-on:click="clusterAlgorithm('DFS')" class="styled-button">
      All_steps_with_DFS
    </button>
    <button v-on:click="clusterAlgorithm('DAG_Dijkstra')" class="styled-button bold">
      All_steps_with_DAG_Dijkstra
    </button>

  

    <div>
    <button @click="setPathType(PathType.LONGEST)" class="styled-button">
      Longest
    </button>
    <button @click="setPathType(PathType.ALL_LONGEST)" class="styled-button"> 
      All Longest
    </button>
    <button @click="setPathType(PathType.ALL)" class="styled-button">
      All
    </button>


    <span class="bold margin">|</span>


    <button v-on:click="mergeChoice(true)" class="styled-button">
      merge
    </button>
    <button v-on:click="mergeChoice(false)" class="styled-button">
      No_merge
    </button>


    <span class="bold margin">|</span>


    <button v-on:click="miniBranchChoice(true)" class="styled-button">
    Minibranch
  </button>
  <button v-on:click="miniBranchChoice(false)" class="styled-button">
    No_Minibranch
  </button>

  </div>


  <div>
  <button v-on:click="sourcesChoice('rank_only')" class="styled-button">
     Rank_only
  </button>
  <button v-on:click="sourcesChoice('rank_source')" class="styled-button"> 
     Rank_source
  </button>
  <button v-on:click="sourcesChoice('source_only')" class="styled-button">
     Source_only
  </button>
</div>


  <div>
 
  <button v-on:click="ordering('default')" class="styled-button">
     Ordering_default
  </button>
  
  <button v-on:click="ordering('out')" class="styled-button">
     Ordering_out
  </button>
 
  <button v-on:click="ordering('in')" class="styled-button">
     Ordering_in
  </button>
</div>


  <h5>Number of crossings in the Network : {{ countIntersection(network) }}</h5>
  <h5>Number of isolated nodes : {{ countIsolatedNodes(network) }}</h5>
  

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
// _________________________________________________________________________________________________
// ---------------------------------------------------------------------  Import
// _________________________________________________________________________________________________


/**
 * Futur développement !!! /!\
 * Penser à retirer les événements lorsqu'on détruit un objet (unMount)
 * removeEventListener -> événements garder en mémoire même après destruction de l'objet donc à retirer manuellement
 */// Import -----------------
  // Utils ----------------
import { ref, reactive, onMounted } from "vue";
import { countIntersection } from "./composables/countIntersections";
import { countIsolatedNodes } from "./composables/countIsolatedNodes";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
import { PathType } from './types/EnumArgs';
//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { dagreLayout, vizLayout } from './composables/useLayout';
import { removeSideCompounds } from "./composables/removeSideCompounds";
import {chooseReversibleReaction, duplicateReversibleReactions} from "./composables/duplicateReversibleReactions"
import {importNetworkFromFile,importNetworkFromURL} from "./composables/importNetwork"
import { networkCopy } from "@/composables/networkToGraph";
import { initZoom, rescale } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import { removeThisNode,duplicateThisNode} from "@metabohub/viz-core";
import {addNodeTocluster, createCluster,} from "./composables/UseClusterNetwork";
import { DFSsourceDAG, DFSWithSources } from "@/composables/algoDFS";
import { createStaticForceLayout } from "@metabohub/viz-core";

// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";
import { node } from "prop-types";
import { ClusterNetwork } from "@/types/ClusterNetwork";
import { SourceType } from "@/types/EnumArgs";
import { addClusterFromSources, getPathSourcesToTargetNode,getLongPathDFS, addMiniBranchToMainChain } from "@/composables/chooseSubgraph";
import { RefSymbol } from "@vue/reactivity";
import { BFSWithSources } from "@/composables/algoBFS";
import { getSources } from "@/composables/rankAndSources";
import { addBoldLinkMainChain } from "@/composables/useSubgraphs";




// _________________________________________________________________________________________________
// ---------------------------------------------------------------------  Variables
// _________________________________________________________________________________________________

const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({
  nodeStyles: {}, 
  linkStyles: {}
});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeNode},{label:'Duplicate', action:duplicateNode},{label:'AddToCluster', action:addToCluster}])
let undoFunction: any = reactive({});
//let clusters : Array<Cluster> =reactive([])
//let attributGraphViz : AttributesViz=reactive({});
let clusterNetwork:ClusterNetwork;
let sourceTypePath:SourceType=SourceType.RANK_SOURCE;
let getCluster=getPathSourcesToTargetNode;
let originalNetwork:Network;
let merge:boolean=true;
let pathType:PathType=PathType.ALL_LONGEST;
let minibranch:boolean=true;







// _________________________________________________________________________________________________
// ---------------------------------------------------------------------  Functions
// _________________________________________________________________________________________________

// ______________________________________________________________________________
// ----------------------------------------------- Core Functions

function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files as FileList;
  const file = files[0];  
  importNetworkFromFile(file, network, networkStyle, callbackFunction);
}


async function callbackFunction() {

  console.log('________New_graph__________');
  clusterNetwork={network:network,attributs:{},clusters:{}};
  clusterNetwork.attributs={rankdir: "BT" , newrank:true, compound:true};

  await removeSideCompounds(network.value,"/sideCompounds.txt").then(
    ()=>{
      originalNetwork=networkCopy(network.value);
    }
  ).then(
    ()=>{
      algoForce();
    }
  ).then(
    ()=>{
      rescale(svgProperties);
    });

    // set style
    if (!("linkStyles" in networkStyle.value)){
      networkStyle.value.linkStyles={}
    }
    networkStyle.value.linkStyles["mainChain"]={strokeWidth:3,stroke:"blue"};

}

function rescaleAfterAction(){
  //console.log('Rescaling');
  rescale(svgProperties);
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

function openContextMenu(Event: MouseEvent, nodeId: string) {
  UseContextMenu.showContextMenu(Event, nodeId);
}


// ______________________________________________________________________________
// ----------------------------------------------- Parameters


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
  clusterNetwork.clusters={}; // temporaire, je reset les clusters pour pas ajouter les nouveaux aux vieux
}

function mergeChoice(value:boolean) {
    merge=value;
}

function setPathType(type:PathType) {
    pathType = type;
}

function miniBranchChoice(value: boolean) {
  minibranch = value;
}

async function clusterAlgorithm(algorithm:string):Promise<void> {
    //console.log(originalNetwork); ////////////////// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

      clusterNetwork=getOriginalNetwork();

        if (algorithm === 'DFS') {
          getCluster = getLongPathDFS;
        } else if (algorithm === 'DAG_Dijkstra') {
          getCluster = getPathSourcesToTargetNode;
        }
        allSteps(clusterNetwork,sourceTypePath).then(
          ()=>{
            rescale(svgProperties)
          }
        );
        
}





// ______________________________________________________________________________
// ----------------------------------------------- Layouts

// no layout 
function getOriginalNetwork():ClusterNetwork{
  //console.log(originalNetwork); ///// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

  clusterNetwork.clusters={};
  network.value=networkCopy(originalNetwork); 
  return clusterNetwork;
}

// force algorithm : force layout
function algoForce(){
  console.log('Force');
  network.value=createStaticForceLayout(network.value);
}

// algorithm pipeline : pathway layout 
async function allSteps(clusterNetwork: ClusterNetwork,sourceTypePath:SourceType=SourceType.RANK_SOURCE):Promise<void> {

let network=clusterNetwork.network.value;

console.log('_____________________________________________');
console.log('Parameters :');
console.log("Source type : "+ sourceTypePath);
console.log("Merge ? " + String(merge));
console.log("Add Mini branch ? " + String(minibranch));
console.log("Type path ? " + pathType);
console.log('---------------');

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
    clusterNetwork = addClusterFromSources(clusterNetwork, sourceTypePath,getCluster, merge,pathType);
  }
).then(
  () => {
    if(minibranch){
      clusterNetwork= addMiniBranchToMainChain(clusterNetwork);
    }
  }
).then(
  () => {
    clusterNetwork = addBoldLinkMainChain(clusterNetwork);
  }
).then(
  () => {
    vizLayout(network, clusterNetwork.clusters, clusterNetwork.attributs, false, rescaleAfterAction);
  }
)
console.log('_____________________________________________');

}






// ______________________________________________________________________________
// ----------------------------------------------- Events

// Action with keyboard
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
    addClusterFromSources(clusterNetwork, sourceTypePath,getCluster, merge,pathType);
  } else if (event.key == "a"){
    allSteps(clusterNetwork,sourceTypePath);
  } else if (event.key == "f"){
    const sources=getSources(network.value,SourceType.RANK_ONLY);
    const {dfs,graph}=DFSsourceDAG(network.value,sources);
    console.log(dfs);
  }
  else if (event.key == "b"){
    const sources=getSources(network.value,SourceType.RANK_ONLY);
    const bfs=BFSWithSources(network.value,sources);
    bfs.forEach(node=>{
      console.log(network.value.nodes[node].label);
    })
  }else if (event.key =="m"){
    clusterNetwork= addMiniBranchToMainChain(clusterNetwork);
  }else if (event.key =="l"){
    clusterNetwork = addBoldLinkMainChain(clusterNetwork);
  }
}







// ______________________________________________________________________________
// ----------------------------------------------- Handmade clusters 

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
  clusterNetwork=addNodeTocluster(clusterNetwork,String(numberCluster-1),menuProps.targetElement); 
}



</script><style>
@import "@metabohub/viz-core/dist/style.css";
@import "@metabohub/viz-context-menu/dist/style.css"; 
.margin {
  margin: 10px; 
}
.bold{
  font-weight: bold;
}
.styled-button {
  background-color: #a1dcff; /* Green */
  border: none;
  color: black;
  padding: 5px 5px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
}
</style>./composables/methode_to_try./composables/toNetwork./composables/convertToGraph./composables/networkToGraph./composables/graphToNetwork