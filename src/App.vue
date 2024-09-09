<template>
  <button v-on:click="rescale(svgProperties)">
    Rescale
  </button>
  <input type="file" accept=".json, .xml" label="File input" v-on:change="loadFile" class=" margin"/>
  <!--<button v-on:click="newCluster()" class="margin">
     New_Cluster
  </button>-->


  
  <button v-on:click="algoForce()" class="styled-button">
    ForceAlgo
  </button>

  <!--<button v-on:click="getOriginalNetwork()" class="styled-button">
      originalLayout
    </button>-->


    <!--<button v-on:click="subgraphAlgorithm('DFS')" class="styled-button">
      All_steps_with_DFS
    </button>-->
    <button v-on:click="subgraphAlgorithm('DAG_Dijkstra')" class="styled-button bold">
      All_steps_with_DAG_Dijkstra
    </button>
    <button v-on:click="loopJson(Algo.FORCE)" class="styled-button">
      Metrics Force
    </button>
    <button v-on:click="loopJson(Algo.VIZ)" class="styled-button">
      Metrics Viz
    </button>
    <button v-on:click="loopJson(Algo.ALGO)" class="styled-button">
      Metrics Algo
    </button>
    <button v-on:click="loopJson(Algo.ALGO_V0)" class="styled-button">
      Metrics Algo V0 
    </button>
    <button v-on:click="loopJson(Algo.ALGO_V1)" class="styled-button">
      Metrics Algo V1
    </button>
    <button v-on:click="loopJson(Algo.ALGO_V3)" class="styled-button">
      Metrics Algo V3
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


    <button v-on:click="Cycle(true)" class="styled-button">
      cycle
    </button>
    <button v-on:click="Cycle(false)" class="styled-button">
      No_cycle
    </button>


    <span class="bold margin">|</span>

    <button v-on:click="mainChainChoice(true)" class="styled-button">
    MainChain
  </button>
  <button v-on:click="mainChainChoice(false)" class="styled-button">
    No_MainChain
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
  <!--<button v-on:click="OnlyUserSources()" class="styled-button">
     Only_user_Sources
  </button>-->
</div>

 
  <div>
 
  <button v-on:click="Ordering(true)" class="styled-button">
     Ordering
  </button>
  
  <button v-on:click="Ordering(false)" class="styled-button">
     No_Ordering
  </button>
 

</div> 


  <h5>Number of crossings in the Network : {{ countIntersectionEdgeNetwork(network,networkStyle,false) }}</h5>
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
//import { RefSymbol } from "@vue/reactivity";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
import { Algo, PathType, StartNodesType } from "@/types/EnumArgs";
import { TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { defaultParameters,Parameters } from "@/types/Parameters";


//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { dagreLayout, forceLayout, vizLayout } from './composables/LayoutSugiyamaForce';
import {chooseReversibleReaction, duplicateReversibleReactions} from "./composables/LayoutReversibleReactions"
import {importNetworkFromFile,importNetworkFromURL} from "./composables/importNetwork"
//import { networkCopy } from "@/composables/ConvertFromNetwork";
import { initZoom, rescale,duplicateNode,removeNode } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import {  addDirectedCycleToSubgraphNetwork } from "@/composables/LayoutFindCycle";
import { countIntersectionEdgeNetwork } from "./composables/MetricsCalculation";
import { countIsolatedNodes } from "./composables/countIsolatedNodes";
import { DFSsourceDAG } from "@/composables/AlgorithmDFS";
import { createStaticForceLayout } from "@metabohub/viz-core";
import { BFSWithSources } from "@/composables/AlgorithmBFS";
import {  getStartNodes } from "@/composables/CalculateStartNodes";
//import { addBoldLinkMainChain, addRedLinkcycleGroup } from "@/composables/useSubgraphs";
import { addMainChainFromSources, getPathSourcesToTargetNode,getLongPathDFS, addMiniBranchToMainChain } from "@/composables/LayoutMainChain";
import { analyseAllJSON, applyMetricsGraph, applyMetricsLayout } from "@/composables/MetricsApplication";
import { addSideCompoundAttributeFromList, duplicateSideCompound } from "@/composables/LayoutManageSideCompounds";





// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";
import { node } from "prop-types";
import func from "vue-temp/vue-editor-bridge";
import { algorithmOnNetwork, allSteps } from "@/composables/LayoutMain";


//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";




// _________________________________________________________________________________________________
// ---------------------------------------------------------------------  Variables
// _________________________________________________________________________________________________

const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({
  nodeStyles: {}, 
  linkStyles: {}
});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeThisNode},{label:'Duplicate', action:duplicateThisNode}]) // {label:'AddToCluster', action:addToCluster} {label:'AddToSource', action:addToUserSource}
let undoFunction: any = reactive({});
//let clusters : Array<Cluster> =reactive([])
let subgraphNetwork:SubgraphNetwork;
let originalNetwork:Network;
let parameters: Parameters=defaultParameters;

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


function callbackFunction() {

  console.log('________New_graph__________');
  // set style
  //changeNodeStyles(networkStyle.value);
  // set subgraphNetwork
  //subgraphNetwork={network:network,networkStyle:networkStyle,attributs:{},mainChains:{}};

  // remove label (for screenshot)
  // Object.values(network.value.nodes).forEach(node=>{
  //       node.label="";
  //     })

  ///subgraphAlgorithm('DAG_Dijkstra')

  // copy network
  //originalNetwork = networkCopy(network.value);

 
  // V1 (rapport)
  // duplicate side-compound 
  // addSideCompoundAttributeFromList(subgraphNetwork,"/sideCompounds.txt").then(()=>{
  //   duplicateSideCompound(subgraphNetwork);
  // });
  
  // // force layout
  // algoForce().then(
  //   ()=>{
  //     rescale(svgProperties);
  //   }
  // );
 


  // V2
  // duplicate side-compound 
  // addSideCompoundAttributeFromList(subgraphNetwork,"/sideCompounds.txt").then(()=>{
  //   duplicateSideCompound(subgraphNetwork);
  // }).then(
  //   ()=>{
  //    // algoForce();
  //   }
  // ).then(
  //   ()=>{
  //     rescale(svgProperties);
  //   }
  // );
  
  // if (!(networkStyle.value.linkStyles)){
  //   networkStyle.value.linkStyles={}
  // }
  // networkStyle.value.linkStyles[TypeSubgraph.MAIN_CHAIN]={strokeWidth:3,stroke:"blue"};
  // networkStyle.value.linkStyles[TypeSubgraph.CYCLEGROUP]={stroke:"red"};

  // to test
  // const size=200;
  // networkStyle.value.nodeStyles["metabolite"]["height"]=size;
  // networkStyle.value.nodeStyles["metabolite"]["width"]=size;
  // networkStyle.value.nodeStyles["reaction"]["height"]=size/50;
  // networkStyle.value.nodeStyles["reaction"]["width"]=size/50;

}

function rescaleAfterAction(){
  rescale(svgProperties);
}

onMounted(() => {
  svgProperties = initZoom();
  //window.addEventListener('keydown', keydownHandler);
  importNetworkFromURL('public/Alanine_and_aspartate_metabolism.json', network, networkStyle, callbackFunction); 
  
});
function removeThisNode() {
  removeNode(menuProps.targetElement.id, network.value);
  originalNetwork=networkCopy(network.value);

}
function duplicateThisNode() {
  duplicateNode(menuProps.targetElement.id, network.value, networkStyle.value);
  originalNetwork=networkCopy(network.value);
}

function openContextMenu(Event: MouseEvent, nodeId: string) {
  UseContextMenu.showContextMenu(Event, nodeId);
}


// ______________________________________________________________________________
// ----------------------------------------------- Parameters


// function ordering(value:string="default"){
//   if (!subgraphNetwork.attributs){
//     subgraphNetwork.attributs={};
//   }
//   if (value == "default" && "ordering" in subgraphNetwork.attributs){
//     delete subgraphNetwork.attributs.ordering;
//   } else if (value == "in" || value == "out"){
//     subgraphNetwork.attributs.ordering=value;
//   }
// }

function sourcesChoice(sourcetype:string):void{
  if (sourcetype==StartNodesType.RANK_ONLY){
    parameters.startNodeTypeMainChain=StartNodesType.RANK_ONLY;
  }
  else if (sourcetype==StartNodesType.RANK_SOURCE){
    parameters.startNodeTypeMainChain=StartNodesType.RANK_SOURCE;
  }
  else if (sourcetype==StartNodesType.SOURCE_ONLY){
    parameters.startNodeTypeMainChain=StartNodesType.SOURCE_ONLY;
  }
  subgraphNetwork.mainChains={}; // temporaire, je reset les clusters pour pas ajouter les nouveaux aux vieux
  subgraphNetwork.secondaryChains={};
  subgraphNetwork.cycles={};
}

function mergeChoice(value:boolean) {
  parameters.merge=value;
}

function Cycle(value:boolean) {
  parameters.doCycle=value;
}

function Ordering(value:boolean) {
  parameters.ordering=value;
}


function setPathType(type:PathType) {
  parameters.pathType = type;
}

function miniBranchChoice(value: boolean) {
  parameters.doMiniBranch = value;
}

function mainChainChoice(value: boolean) {
  parameters.doMainChain = value;
}

// function OnlyUserSources(){
//   onlyUserSources=!onlyUserSources;
// }

// function allowInternalCycle(value:boolean){
//   parameters.allowInternalCycles=value;
// }

// function groupInsteadCluster(value:boolean){
//   if(value){
//     parameters.groupOrCluster="group";
//   }else{
//     parameters.groupOrCluster="cluster";
//   }
// }

// function addNodesViz(value:boolean){
//   parameters.addNodes=value;
//}

async function subgraphAlgorithm(algorithm:string):Promise<void> {
    //console.log(originalNetwork); ////////////////// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

      //subgraphNetwork=getOriginalNetwork();

      if (algorithm === 'DFS') {
        parameters.getSubgraph = getLongPathDFS;
      } else if (algorithm === 'DAG_Dijkstra') {
        parameters.getSubgraph = getPathSourcesToTargetNode;
      }
      
      try {
          //subgraphNetwork = await allSteps(subgraphNetwork, parameters);
          network.value=await algorithmOnNetwork(network.value,networkStyle.value,parameters);
          rescale(svgProperties);
      } catch (error) {
          console.error('Error executing allSteps:', error);
      }
        
}







// ______________________________________________________________________________
// ----------------------------------------------- Layouts

// no layout 
// function getOriginalNetwork():SubgraphNetwork{
//   //console.log(originalNetwork); ///// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

//   subgraphNetwork.mainChains={};
//   network.value=networkCopy(originalNetwork); 
//   return subgraphNetwork;
// }

// force algorithm : force layout
async function algoForce():Promise<void>{
  console.log('Force');
  //createStaticForceLayout(network.value);
  forceLayout(network.value,networkStyle.value,true);
  
}


// ______________________________________________________________________________
// ----------------------------------------------- Events

// Action with keyboard
// function keydownHandler(event: KeyboardEvent) {
//   if (event.key === 'ArrowLeft') {
//     dagreLayout(network.value,{}, rescaleAfterAction);
//   } else if (event.key === 'ArrowRight') {
//     //vizLayout(subgraphNetwork ,true,true,true,"cluster",true, false,parameters.dpi,parameters.numberNodeOnEdge,rescaleAfterAction);
//     vizLayout(subgraphNetwork, false,false,parameters.addNodes,parameters.groupOrCluster,false,false,parameters.dpi,parameters.numberNodeOnEdge,rescaleAfterAction);
//   } else if (event.key === "d") {
//     duplicateReversibleReactions(network.value);
//   } else if (event.key =="n"){
//     //console.log(subgraphNetwork);
//     console.log(network.value);
//     console.log(parameters);
//   }else if (event.key == "m"){
//     console.log(applyMetricsGraph(network.value));
//     console.log(applyMetricsLayout(subgraphNetwork,false));
//   } else if (event.key =="c"){
//     addDirectedCycleToSubgraphNetwork(subgraphNetwork);
//   }else if (event.key =="r"){
//     (async () => {
//       const sources=getStartNodes(network.value,StartNodesType.RANK_SOURCE_ALL);
//       subgraphNetwork= await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
//     })();
//   }else if (event.key =="p"){
//     const sources=await getStartNodes(network.value,parameters.startNodeTypeMainChain);
//     addMainChainFromSources(subgraphNetwork, sources,parameters.getSubgraph, parameters.merge,parameters.pathType);
//     //subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
//   } else if (event.key == "a"){
//     allSteps(subgraphNetwork,parameters);
//   } else if (event.key == "f"){
//     const sources=getStartNodes(network.value,StartNodesType.RANK_ONLY);
//     const {dfs,graph}=DFSsourceDAG(network.value,sources);
//     console.log(dfs);
//   }
//   else if (event.key == "b"){
//     const sources=getStartNodes(network.value,StartNodesType.RANK_ONLY);
//     const bfs=BFSWithSources(network.value,sources);
//     bfs.forEach(node=>{
//       console.log(network.value.nodes[node].label);
//     })
//   }else if (event.key =="m"){
//     subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
//   }else if (event.key =="l"){
//     subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
//   }
// }


function loopJson(algo?:Algo):void{
  analyseAllJSON("public/nameJSON.txt",algo);
}




// ______________________________________________________________________________
// ----------------------------------------------- Handmade clusters et sources

// function newCluster(){
//   const numberCluster=Object.keys(subgraphNetwork.mainChains).length;
//   const cluster= createSubgraph(String(numberCluster),[],[],TypeSubgraph.MAIN_CHAIN);
//   subgraphNetwork.mainChains[cluster.name]=cluster;
// }

// function addToCluster() {
//   let numberCluster=Object.keys(subgraphNetwork.mainChains).length;
//   if (numberCluster === 0){
//     newCluster();
//     numberCluster+=1;
//   }
//   subgraphNetwork=addNodeToSubgraph(subgraphNetwork,String(numberCluster-1),menuProps.targetElement,TypeSubgraph.MAIN_CHAIN); 
// }

// function addToUserSource() {
//   userSources.push(menuProps.targetElement); 
// }




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