import { Parameters } from "@/types/Parameters";
import { PathType, SourceType } from "@/types/EnumArgs";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { putDuplicatedSideCompoundAside, reinsertionSideCompounds } from "./manageSideCompounds";
import { vizLayout } from "./useLayout";
import { chooseReversibleReaction, duplicateReversibleReactions } from "./duplicateReversibleReactions";
import { addDirectedCycleToSubgraphNetwork } from "./findCycle";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { BFSWithSources } from "./algoBFS";
import { addMainChainFromSources, addMiniBranchToMainChain } from "./chooseSubgraph";
import { coordinateAllCycles, drawAllCyclesGroup } from "./drawCycle";
import { shiftCoordToCenter } from "./calculateSize";
import { getSources } from "./rankAndSources";

export async function allSteps(subgraphNetwork: SubgraphNetwork,parameters:Parameters,shiftCoord:boolean=true,printNameStep:boolean=false):Promise<SubgraphNetwork> {

    let network=subgraphNetwork.network.value;
    let networkStyle=subgraphNetwork.networkStyle.value;
  
    if (printNameStep){
      console.log('_____________________________________________');
      console.log('Parameters :');
      console.log(parameters);
      console.log('---------------');
    }
  
  
    if (printNameStep) console.log('SideCompound aside');
    await putDuplicatedSideCompoundAside(subgraphNetwork,"/sideCompounds.txt").then(
      (subgraphNetworkModified)=>{
          subgraphNetwork=subgraphNetworkModified;
      }
    ).then(
      async () => {
        //  get rank 0 with Sugiyama
        if (printNameStep) console.log('First Viz (get ranks)');
        await vizLayout(subgraphNetwork, true,false,parameters.addNodes,parameters.groupOrCluster,false);
      }
    ).then(
      () => {
        // duplicate reactions
        if (printNameStep) console.log('Duplicate reversible reactions');
        duplicateReversibleReactions(network);
      }
    ).then(
      () => {
        // detect cycles and choose some of the reaction duplicated
        if (parameters.cycle){
          if (printNameStep) console.log('Find directed cycles');
          addDirectedCycleToSubgraphNetwork(subgraphNetwork,3);
        }
      }
    ).then(
      async () => {
        // choose all other reversible reactions
        if (printNameStep) console.log('Choose reversible reactions');
        const sources=getSources(network,SourceType.RANK_SOURCE_ALL);
        subgraphNetwork=await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
      }
    ).then(
      () => {
        // get main chains
        if (parameters.mainchain){
          if (printNameStep) console.log('Find main chain');
          const sources=getSources(network,parameters.sourceTypePath);
          addMainChainFromSources(subgraphNetwork, sources,parameters.getSubgraph, parameters.merge,parameters.pathType);
        }
      }
    ).then(
      () => {
        // add minibranch
        if(parameters.mainchain && parameters.minibranch){
          if (printNameStep) console.log('Add minibranch');
          subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
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
        if (parameters.cycle){
          if (printNameStep) console.log('Coordinate directed cycles');
          await coordinateAllCycles(subgraphNetwork,parameters.allowInternalCycles);
        }
      }
    ).then(
      async () => {
        // Sugiyama with cycle metanodes 
        if (parameters.cycle){
          if (printNameStep) console.log('Third Viz (metanodes for directed cycles)');
          await vizLayout(subgraphNetwork, false,true,parameters.addNodes,parameters.groupOrCluster,parameters.ordering,false,parameters.dpi,parameters.numberNodeOnEdge);
        }
      }
    ).then(
      () => {
        // place the cycles
        if (parameters.cycle){
          if (printNameStep) console.log('Place directed cycles');
          drawAllCyclesGroup(subgraphNetwork);
        }
      }
    ).then(
      () => {
        // reverse side compounds of reversed reactions
        if (printNameStep) console.log('Insert side compounds');
        subgraphNetwork=reinsertionSideCompounds(subgraphNetwork,parameters.factorLengthSideCompounds);
      }
    ).then(
      () => {
        // shift coordinates : center is at the previous coord (because of top left corner)
        if (shiftCoord){
          if (printNameStep) console.log('Shift coordinates nodes to have center at the old coordinates');
          shiftCoordToCenter(network,networkStyle);
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


  