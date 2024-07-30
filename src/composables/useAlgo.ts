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

export async function allSteps(subgraphNetwork: SubgraphNetwork,parameters:Parameters):Promise<SubgraphNetwork> {

    let network=subgraphNetwork.network.value;
    let networkStyle=subgraphNetwork.networkStyle.value;
  
    console.log('_____________________________________________');
    console.log('Parameters :');
    console.log(parameters);
    console.log('---------------');
  
  
  
    await putDuplicatedSideCompoundAside(subgraphNetwork,"/sideCompounds.txt").then(
      (subgraphNetworkModified)=>{
          subgraphNetwork=subgraphNetworkModified;
      }
    ).then(
      async () => {
        //  get rank 0 with Sugiyama
        await vizLayout(subgraphNetwork, true,false,parameters.addNodes,parameters.groupOrCluster,false);
      }
    ).then(
      () => {
        // duplicate reactions
        duplicateReversibleReactions(network);
      }
    ).then(
      () => {
        // detect cycles and choose some of the reaction duplicated
        if (parameters.cycle){
          addDirectedCycleToSubgraphNetwork(subgraphNetwork,3);
        }
      }
    ).then(
      async () => {
        // choose all other reversible reactions
        const sources=getSources(network,SourceType.RANK_SOURCE_ALL);
        subgraphNetwork=await chooseReversibleReaction(subgraphNetwork,sources,BFSWithSources);
      }
    ).then(
      () => {
        // get main chains
        if (parameters.mainchain){
          const sources=getSources(network,parameters.sourceTypePath);
          addMainChainFromSources(subgraphNetwork, sources,parameters.getSubgraph, parameters.merge,parameters.pathType);
        }
      }
    ).then(
      () => {
        // add minibranch
        if(parameters.mainchain && parameters.minibranch){
          subgraphNetwork= addMiniBranchToMainChain(subgraphNetwork);
        }
      }
    ).then(
      async () => {
        // Sugiyama without cycle metanodes (to get top nodes for cycles)
        await vizLayout(subgraphNetwork, false,false,parameters.addNodes,parameters.groupOrCluster,false);
      }
    ).then(
      async () => {
        // relative coordinates for cycles
        if (parameters.cycle){
          await coordinateAllCycles(subgraphNetwork,parameters.allowInternalCycles);
        }
      }
    ).then(
      async () => {
        // Sugiyama with cycle metanodes 
        if (parameters.cycle){
          await vizLayout(subgraphNetwork, false,true,parameters.addNodes,parameters.groupOrCluster,parameters.ordering,false,parameters.dpi,parameters.numberNodeOnEdge);
        }
      }
    ).then(
      () => {
        // place the cycles
        if (parameters.cycle){
          drawAllCyclesGroup(subgraphNetwork);
        }
      }
    ).then(
      () => {
        // reverse side compounds of reversed reactions
        subgraphNetwork=reinsertionSideCompounds(subgraphNetwork,parameters.factorLengthSideCompounds);
      }
    ).then(
      () => {
        // shift coordinates : center is at the previous coord (because of top left corner)
        // but for cycle, as it is already done
        shiftCoordToCenter(network,networkStyle);
      }
    ).then(
      () => {
        // add color to link (optional : for debug)
        //subgraphNetwork = addBoldLinkMainChain(subgraphNetwork);
        //subgraphNetwork=addRedLinkcycleGroup(subgraphNetwork);
      }
    );
    console.log('_____________________________________________');
    return subgraphNetwork;
  
}


  