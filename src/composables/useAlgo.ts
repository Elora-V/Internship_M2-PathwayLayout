// Type imports
import { defaultParameters,Parameters } from "@/types/Parameters";
import { SourceType } from "@/types/EnumArgs";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

// Composable imports
import { putDuplicatedSideCompoundAside, reinsertionSideCompounds } from "./manageSideCompounds";
import { vizLayout } from "./useLayout";
import { chooseReversibleReaction, duplicateReversibleReactions } from "./duplicateReversibleReactions";
import { addDirectedCycleToSubgraphNetwork } from "./findCycle";
import { BFSWithSources } from "./algoBFS";
import { addMainChainFromSources, addMiniBranchToMainChain } from "./chooseSubgraph";
import { coordinateAllCycles, drawAllCyclesGroup } from "./drawCycle";
import { shiftAllToGetTopLeftCoord } from "./calculateSize";
import { getSources } from "./rankAndSources";

// General imports
import { Ref } from "vue";
import { TypeSubgraph } from "@/types/Subgraph";


/*******************************************************************************************************************************************************
 * This file contains the main function of the algorithm (that is to change the coordinates of a network => application of the layout).
 * 
 * -> algorithmOnNetwork : 
 *      change the nodes coordinates of network
 * -> allSteps : 
 *      apply all steps of the algorithm to change node coordinates of a network
 * *******************************************************************************************************************************************************/



/**
 * Change the nodes coordinates of network 
 * @param networkRef a ref of the network to change (ref to type Network)
 * @param networkStyleRef a ref of the style of the network to change (ref to type GraphStyleProperties)
 * @param parameters parameters for the algorithm
 */
export async function algorithmOnNetwork(networkRef:Ref<Network>,networkStyleRef:Ref<GraphStyleProperties>,parameters:Parameters=defaultParameters):Promise<void>{

  // initialize the subgraphNetwork and parameters if necessary
    let subgraphNetwork:SubgraphNetwork={
      network:networkRef,
      networkStyle:networkStyleRef,
    }

    // change coordinates of the network with the algorithm
    try {
      await allSteps(subgraphNetwork,parameters,true,true);
    } catch(err){
      console.log(" Error during execution of algorithm : " + err);
    }
}


/**
 * Apply all steps of the algorithm to change node coordinates of a network. SubgraphNetwork is an object that contains the network to change and all the information needed during the steps.
 * @param subgraphNetwork object that contains the network, network style, attributs for viz, subgraph information and side compounds
 * @param parameters parameters for the algorithm
 * @param shiftCoord change the coordinates to have the one of the top left corner of nodes, if false, the coordinates are the centers
 * @param printNameStep print the name of the steps during execution
 * @returns a promise of the subgraphNetwork 
 */
export async function allSteps(subgraphNetwork: SubgraphNetwork,parameters:Parameters,shiftCoord:boolean=true,printNameStep:boolean=false):Promise<SubgraphNetwork> {

    let network=subgraphNetwork.network.value;
    let networkStyle=subgraphNetwork.networkStyle.value;
  
    if (printNameStep){
      console.log('_____________________________________________');
      console.log('Parameters :');
      console.log(parameters);
      console.log('---------------');
    }
  
  
    // duplicate side compounds and put them aside
    if (printNameStep) console.log('SideCompound duplication and put aside');
    await putDuplicatedSideCompoundAside(subgraphNetwork,parameters.doDuplicateSideCompounds,parameters.doPutAsideSideCompounds,true,"/sideCompounds.txt").then(
      (subgraphNetworkModified)=>{
          subgraphNetwork=subgraphNetworkModified;
      }
    ).then(
      async () => {
        if (parameters.doMainChain  || parameters.doReactionReversible){
          //  get rank 0 with Sugiyama (usefull for main chain and reaction reversible)
          if (printNameStep) console.log('First Viz (get ranks)');
          await vizLayout(subgraphNetwork, true,false,parameters.addNodes,parameters.groupOrCluster,false);
        }
      }
    ).then(
      () => {
        if (parameters.doReactionReversible){
          // duplicate reactions
          if (printNameStep) console.log('Duplicate reversible reactions');
          duplicateReversibleReactions(network);
        }
      }
    ).then(
      () => {
        // detect cycles and choose some of the reaction duplicated
        if (parameters.doCycle){
          if (printNameStep) console.log('Find directed cycles');
          addDirectedCycleToSubgraphNetwork(subgraphNetwork,3);
          // if no cycle, we don't need to do the cycle step
          if (subgraphNetwork[TypeSubgraph.CYCLE] && Object.keys(subgraphNetwork[TypeSubgraph.CYCLE]).length===0){
            parameters.doCycle=false;
            console.warn('doCycle is true but no cycle found : doCycle set to false');
          }
        }
      }
    ).then(
      async () => {
        if (parameters.doReactionReversible){
          // choose all other reversible reactions
          if (printNameStep) console.log('Choose reversible reactions');
          const sources=getSources(network,SourceType.RANK_SOURCE_ALL);
          subgraphNetwork=await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
        }
      }
    ).then(
      () => {
        // get main chains
        if (parameters.doMainChain){
          if (printNameStep) console.log('Find main chain');
          const sources=getSources(network,parameters.startNodeTypeMainChain);
          addMainChainFromSources(subgraphNetwork, sources,parameters.getSubgraph, parameters.merge,parameters.pathType);
        }
      }
    ).then(
      () => {
        // add minibranch
        if(parameters.doMainChain && parameters.doMiniBranch){
          if (printNameStep) console.log('Add minibranch');
          subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
        }else if ( !parameters.doMainChain && parameters.doMiniBranch){
          console.warn('doMiniBranch is true but doMainChain is false : minibranch will not be added');
        }
      }
    ).then(
      async () => {
        // Sugiyama without cycle metanodes (to get top nodes for cycles)
        if (printNameStep) console.log('Second Viz (get top nodes if cycles, else final viz)');
        await vizLayout(subgraphNetwork, false,false,parameters.addNodes,parameters.groupOrCluster,false);
      }
    ).then(
      async () => {
        // relative coordinates for cycles
        if (parameters.doCycle){
          if (printNameStep) console.log('Coordinate directed cycles');
          await coordinateAllCycles(subgraphNetwork,parameters.allowInternalCycles);
        }
      }
    ).then(
      async () => {
        // Sugiyama with cycle metanodes 
        if (parameters.doCycle){
          if (printNameStep) console.log('Third Viz (metanodes for directed cycles)');
          await vizLayout(subgraphNetwork, false,true,parameters.addNodes,parameters.groupOrCluster,parameters.ordering,false,parameters.dpi,parameters.numberNodeOnEdge);
        }
      }
    ).then(
      () => {
        // place the cycles
        if (parameters.doCycle){
          if (printNameStep) console.log('Place directed cycles');
          drawAllCyclesGroup(subgraphNetwork);
        }
      }
    ).then(
      () => {
        if (parameters.doDuplicateSideCompounds && parameters.doPutAsideSideCompounds){
          // reverse side compounds of reversed reactions, and apply motif to insert side compounds
          if (printNameStep) console.log('Insert side compounds');
          subgraphNetwork=reinsertionSideCompounds(subgraphNetwork,parameters.factorLengthSideCompounds,parameters.doReactionReversible);
        }else if (!parameters.doDuplicateSideCompounds && parameters.doPutAsideSideCompounds){
          console.warn('doPutAsideSideCompounds is true but doDuplicateSideCompounds is false : side compounds will not be inserted with the motif (original position keeped)');
        }
      }
    ).then(
      () => {
        // shift coordinates to have top left corner coordinate (because of svg drawing)
        if (shiftCoord){
          if (printNameStep) console.log('Shift coordinates nodes to have center at the old coordinates');
          shiftAllToGetTopLeftCoord(network,networkStyle);
        }
      }
    ).then(
      () => {
        // add color to link (optional : for debug)
        //subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
        //subgraphNetwork=addRedLinkcycleGroup(subgraphNetwork);
      }
    );
    return subgraphNetwork;
  
}


  