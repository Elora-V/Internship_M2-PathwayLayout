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


    <button v-on:click="subgraphAlgorithm('DFS')" class="styled-button">
      All_steps_with_DFS
    </button>
    <button v-on:click="subgraphAlgorithm('DAG_Dijkstra')" class="styled-button bold">
      All_steps_with_DAG_Dijkstra
    </button>

    <span class="bold margin">|</span>


    <button v-on:click="addNodesViz(true)" class="styled-button">
      Add_Nodes
    </button>
    <button v-on:click="addNodesViz(false)" class="styled-button">
      No_nodes
    </button>

    <span class="bold margin">|</span>


    <button v-on:click="groupInsteadCluster(true)" class="styled-button">
      Group
    </button>
    <button v-on:click="groupInsteadCluster(false)" class="styled-button">
      Cluster
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
    <button v-on:click="allowInternalCycle(true)" class="styled-button">
      internal_cycle
    </button>
    <button v-on:click="allowInternalCycle(false)" class="styled-button">
      No_internal_cycle
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
  <button v-on:click="OnlyUserSources()" class="styled-button">
     Only_user_Sources
  </button>
</div>

 
  <div>
 
  <button v-on:click="Ordering(true)" class="styled-button">
     Ordering
  </button>
  
  <button v-on:click="Ordering(false)" class="styled-button">
     No_Ordering
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
//import { RefSymbol } from "@vue/reactivity";

  // Types ----------------
import type { Network } from "@metabohub/viz-core/src/types/Network";
import { SourceType } from "@/types/EnumArgs";
import { Subgraph, TypeSubgraph } from "@/types/Subgraph";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { PathType } from './types/EnumArgs';

//import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

  // Composables ----------
// import { createStaticForceLayout, createForceLayout } from './composables/UseCreateForceLayout';
import { dagreLayout, vizLayout } from './composables/useLayout';
import { removeSideCompounds } from "./composables/removeSideCompounds";
import {chooseReversibleReaction, duplicateReversibleReactions} from "./composables/duplicateReversibleReactions"
import {importNetworkFromFile,importNetworkFromURL} from "./composables/importNetwork"
import { networkCopy } from "@/composables/networkToGraph";
import { initZoom, rescale,duplicateNode,removeNode } from "@metabohub/viz-core";
import { UseContextMenu } from "@metabohub/viz-context-menu";
import { JohnsonAlgorithm, addDirectedCycleToSubgraphNetwork } from "@/composables/findCycle";
import { countIntersection } from "./composables/countIntersections";
import { countIsolatedNodes } from "./composables/countIsolatedNodes";
import { DFSsourceDAG, DFSWithSources } from "@/composables/algoDFS";
import { createStaticForceLayout } from "@metabohub/viz-core";
import { BFSWithSources } from "@/composables/algoBFS";
import { concatSources, getSources } from "@/composables/rankAndSources";
import { addBoldLinkMainChain, addRedLinkcycleGroup } from "@/composables/useSubgraphs";
import { addMainChainFromSources, getPathSourcesToTargetNode,getLongPathDFS, addMiniBranchToMainChain } from "@/composables/chooseSubgraph";



// import { addMappingStyleOnNode } from "./composables/UseStyleManager";
// import { createUndoFunction } from "./composables/UseUndo";
  // Components -----------
import { NetworkComponent } from "@metabohub/viz-core";
import { ContextMenu } from "@metabohub/viz-context-menu";
import { node } from "prop-types";
import { addNodeToSubgraph, createSubgraph } from "@/composables/UseSubgraphNetwork";
import { coordinateAllCycles, drawAllCyclesGroup } from "@/composables/drawCycle";
import func from "vue-temp/vue-editor-bridge";
import { putDuplicatedSideCompoundAside, updateSideCompoundsReversibleReaction } from "@/composables/manageSideCompounds";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";




// _________________________________________________________________________________________________
// ---------------------------------------------------------------------  Variables
// _________________________________________________________________________________________________

const network = ref<Network>({id: '', nodes: {}, links: []});
const networkStyle = ref<GraphStyleProperties>({
  nodeStyles: {}, 
  linkStyles: {}
});
let svgProperties = reactive({});
const menuProps=UseContextMenu.defineMenuProps([{label:'Remove',action:removeThisNode},{label:'Duplicate', action:duplicateThisNode},{label:'AddToCluster', action:addToCluster},{label:'AddToSource', action:addToUserSource}])
let undoFunction: any = reactive({});
//let clusters : Array<Cluster> =reactive([])
//let attributGraphViz : AttributesViz=reactive({});
let subgraphNetwork:SubgraphNetwork;
let sourceTypePath:SourceType=SourceType.RANK_SOURCE;
let getSubgraph=getPathSourcesToTargetNode;
let originalNetwork:Network;
let merge:boolean=true;
let pathType:PathType=PathType.ALL_LONGEST;
let minibranch:boolean=true;
let mainchain:boolean=true;
let userSources:string[]=[];
let onlyUserSources:boolean=false;
let cycle:boolean=true;
let allowInternalCycles:boolean=false;
let groupOrCluster:"group"|"cluster"="cluster";
let addNodes:boolean=true;
let ordering:boolean=true;



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
  // set subgraphNetwork
  subgraphNetwork={network:network,networkStyle:networkStyle,attributs:{},mainChains:{}};
  subgraphNetwork.attributs={rankdir: "BT" , newrank:true, compound:true};

  // copy network
  originalNetwork = networkCopy(network.value);

  // force layout
  algoForce().then(
    ()=>{
      rescale(svgProperties);
    }
  );

  // set style
  changeNodeStyles(networkStyle.value);
  if (!(networkStyle.value.linkStyles)){
    networkStyle.value.linkStyles={}
  }
  networkStyle.value.linkStyles[TypeSubgraph.MAIN_CHAIN]={strokeWidth:3,stroke:"blue"};
  networkStyle.value.linkStyles[TypeSubgraph.CYCLEGROUP]={stroke:"red"};

}

function rescaleAfterAction(){
  rescale(svgProperties);
}

onMounted(() => {
  svgProperties = initZoom();
  window.addEventListener('keydown', keydownHandler);
  importNetworkFromURL('/pathways/Aminosugar_metabolism.json', network, networkStyle, callbackFunction); 
  
});
function removeThisNode() {
  removeNode(menuProps.targetElement, network.value);
  originalNetwork=networkCopy(network.value);

}
function duplicateThisNode() {
  duplicateNode(menuProps.targetElement, network.value, networkStyle.value);
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
  if (sourcetype==SourceType.RANK_ONLY){
    sourceTypePath=SourceType.RANK_ONLY;
  }
  else if (sourcetype==SourceType.RANK_SOURCE){
    sourceTypePath=SourceType.RANK_SOURCE;
  }
  else if (sourcetype==SourceType.SOURCE_ONLY){
    sourceTypePath=SourceType.SOURCE_ONLY;
  }
  subgraphNetwork.mainChains={}; // temporaire, je reset les clusters pour pas ajouter les nouveaux aux vieux
  subgraphNetwork.secondaryChains={};
  subgraphNetwork.cycles={};
}

function mergeChoice(value:boolean) {
    merge=value;
}

function Cycle(value:boolean) {
    cycle=value;
}

function Ordering(value:boolean) {
    ordering=value;
}


function setPathType(type:PathType) {
    pathType = type;
}

function miniBranchChoice(value: boolean) {
  minibranch = value;
}

function mainChainChoice(value: boolean) {
  mainchain = value;
}

function OnlyUserSources(){
  onlyUserSources=!onlyUserSources;
}

function allowInternalCycle(value:boolean){
  allowInternalCycles=value;
}

function groupInsteadCluster(value:boolean){
  if(value){
    groupOrCluster="group";
  }else{
    groupOrCluster="cluster";
  }
}

function addNodesViz(value:boolean){
  addNodes=value;
}

async function subgraphAlgorithm(algorithm:string):Promise<void> {
    //console.log(originalNetwork); ////////////////// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

      subgraphNetwork=getOriginalNetwork();

        if (algorithm === 'DFS') {
          getSubgraph = getLongPathDFS;
        } else if (algorithm === 'DAG_Dijkstra') {
          getSubgraph = getPathSourcesToTargetNode;
        }
        allSteps(subgraphNetwork,sourceTypePath).then(
          ()=>{
            rescale(svgProperties)
          }
        );
        
}

function getSourcesParam(network:Network,sourceType:SourceType):string[]{
  let sources:string[]=[];
    if(onlyUserSources){
      sources=userSources;
    }else{
      sources = concatSources(userSources as string[],getSources(network,sourceType));
    }
    return sources;
}





// ______________________________________________________________________________
// ----------------------------------------------- Layouts

// no layout 
function getOriginalNetwork():SubgraphNetwork{
  //console.log(originalNetwork); ///// MARCHE PAS CAR CA PRINT PAS L'ORIGINAL ALORS QUE JE L4AI PAS CHANGE

  subgraphNetwork.mainChains={};
  network.value=networkCopy(originalNetwork); 
  return subgraphNetwork;
}

// force algorithm : force layout
async function algoForce():Promise<void>{
  console.log('Force');
  createStaticForceLayout(network.value);
}

// algorithm pipeline : pathway layout 
async function allSteps(subgraphNetwork: SubgraphNetwork,sourceTypePath:SourceType=SourceType.RANK_SOURCE):Promise<void> {

let network=subgraphNetwork.network.value;

console.log('_____________________________________________');
console.log('Parameters :');
console.log("Source type : "+ sourceTypePath);
console.log('Only user sources ? ' + String(onlyUserSources));
console.log("Merge ? " + String(merge));
console.log('Main chain ? ' + String(mainchain));
console.log("Add Mini branch ? " + String(minibranch));
console.log("Type path ? " + pathType);
console.log('Cycle ? ' + String(cycle));
console.log('Allow internal cycle ? ' + String(allowInternalCycles));
console.log('addNodes ' +String(addNodes));
if(!(!addNodes && groupOrCluster=="group")){
  console.log('groupOrCluster '+groupOrCluster);
}
console.log('Ordering ? ' + String(ordering));
console.log('---------------');



await putDuplicatedSideCompoundAside(subgraphNetwork,"/sideCompounds.txt").then(
   (subgraphNetworkModified)=>{
       subgraphNetwork=subgraphNetworkModified;
   }
).then(
  async () => {
    //  get rank 0 with Sugiyama
    await vizLayout(subgraphNetwork, true,false,addNodes,groupOrCluster,false);
  }
).then(
  () => {
    // duplicate reactions
    duplicateReversibleReactions(network);
  }
).then(
  () => {
    // detect cycles and choose some of the reaction duplicated
    if (cycle){
      addDirectedCycleToSubgraphNetwork(subgraphNetwork,3);
    }
  }
).then(
  async () => {
    // choose all other reversible reactions
    const sources=getSourcesParam(network,SourceType.RANK_SOURCE_ALL);
    subgraphNetwork=await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
  }
).then(
  () => {
    // get main chains
    if (mainchain){
      const sources=getSourcesParam(network,sourceTypePath);
      addMainChainFromSources(subgraphNetwork, sources,getSubgraph, merge,pathType);
    }
  }
).then(
  () => {
    // add minibranch
    if(minibranch){
      subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
    }
  }
).then(
  async () => {
    // Sugiyama without cycle metanodes (to get top nodes for cycles)
    await vizLayout(subgraphNetwork, false,false,addNodes,groupOrCluster,false);
  }
).then(
  () => {
    // relative coordinates for cycles
    if (cycle){
      coordinateAllCycles(subgraphNetwork,allowInternalCycles);
    }
  }
).then(
  async () => {
    // Sugiyama with cycle metanodes 
    if (cycle){
      await vizLayout(subgraphNetwork, false,true,addNodes,groupOrCluster,ordering,false,rescaleAfterAction);
    }
  }
).then(
  () => {
    // place the cycles
    if (cycle){
      drawAllCyclesGroup(subgraphNetwork);
    }
  }
).then(
  () => {
    // reverse side compounds of reversed reactions
    subgraphNetwork=updateSideCompoundsReversibleReaction(subgraphNetwork);
  }
).then(
  () => {
    // add color to link (optional : for debug)
    subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
    subgraphNetwork=addRedLinkcycleGroup(subgraphNetwork);
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
    vizLayout(subgraphNetwork ,true,true,true,"cluster",true, false,rescaleAfterAction);
  } else if (event.key === "d") {
    duplicateReversibleReactions(network.value);
  } else if (event.key =="n"){
    console.log(subgraphNetwork);
  } else if (event.key =="c"){
    addDirectedCycleToSubgraphNetwork(subgraphNetwork);
  }else if (event.key =="r"){
    (async () => {
      const sources=getSourcesParam(network.value,SourceType.RANK_SOURCE_ALL);
      subgraphNetwork= await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
    })();
  }else if (event.key =="p"){
    const sources=getSourcesParam(network.value,sourceTypePath);
    addMainChainFromSources(subgraphNetwork, sources,getSubgraph, merge,pathType);
    subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
  } else if (event.key == "a"){
    allSteps(subgraphNetwork,sourceTypePath);
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
    subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
  }else if (event.key =="l"){
    subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
  }
}







// ______________________________________________________________________________
// ----------------------------------------------- Handmade clusters et sources

function newCluster(){
  const numberCluster=Object.keys(subgraphNetwork.mainChains).length;
  const cluster= createSubgraph(String(numberCluster),[],[],TypeSubgraph.MAIN_CHAIN);
  subgraphNetwork.mainChains[cluster.name]=cluster;
}

function addToCluster() {
  let numberCluster=Object.keys(subgraphNetwork.mainChains).length;
  if (numberCluster === 0){
    newCluster();
    numberCluster+=1;
  }
  subgraphNetwork=addNodeToSubgraph(subgraphNetwork,String(numberCluster-1),menuProps.targetElement,TypeSubgraph.MAIN_CHAIN); 
}

function addToUserSource() {
  userSources.push(menuProps.targetElement); 
}

// ______________________________________________________________________________
// ----------------------------------------------- Style

function changeNodeStyles(networkStyle:GraphStyleProperties):void{
	networkStyle.nodeStyles = {
		metabolite: {
			width: 20,
			height: 20,
			fill:  '#FFFFFF',
			shape: 'circle'
		},
    sideCompound: {
			width: 12,
			height: 12,
			fill:  '#f0e3e0',
			shape: 'circle'
		},
		reaction: {
			width: 15,
			height: 15,
			fill: "grey",
			shape: 'rect'
		},
		reversible : {
			fill : "green",
			shape:"inverseTriangle"
		},
		reversibleVersion:{
			fill:"red",
			shape: "triangle"
		}

	}
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