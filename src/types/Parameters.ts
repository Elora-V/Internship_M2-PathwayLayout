import { Network } from "@metabohub/viz-core/src/types/Network";
import { PathType, SourceType } from "./EnumArgs";
import { getPathSourcesToTargetNode } from "@/composables/chooseSubgraph";

/**
 * This file contains the types for the Parameters object : all parameters for the algorithm
 */


export interface Parameters {

    doDuplicateSideCompounds: boolean; // do the step duplicate side compounds ?
    doPutAsideSideCompounds: boolean; // do the step put aside side compounds ?

    doReactionReversible: boolean; // do the step duplication and choice of reaction reversible ?

    doMainChain: boolean; // do the step main chain ?
    getSubgraph : (network: Network, sources: Array<string>,merge?:boolean,pathType?:PathType) => {[key:string]:{nodes:Array<string>, height:number}}; // function to get subgraph (main chain)
    startNodeTypeMainChain: SourceType; // for the main chain step : which are the start nodes?
    pathType: PathType; // main chain step : longest path , all longest paths or all paths
    merge: boolean; // merging main chain ? If not : nodes can be in several clusters
    doMiniBranch: boolean; // adding minibranch for main chains ?
    groupOrCluster: "group" | "cluster"; //main chain as group or cluster in DOT

    doCycle: boolean; // do the step cycle ?
    allowInternalCycles: boolean; // allow internal cycles for tangent one ?

    addNodes: boolean; // adding node at the beginning of the DOT ?
    ordering: boolean; // reorder edges in DOT ? (for cycle step)

    dpi: number; // DPI for the image (viz parameter)

    numberNodeOnEdge: number; // space between two rank, with size of a node as unit (mean of all size)
    factorLengthSideCompounds: number; // % of the lenght of minimal edge to use as lenght of side compounds edges

    shiftCoord?: boolean; // shift coordinates : center is at the previous coord (because of top left corner)

    //userSources: string[];
    //onlyUserSources: boolean;
}

export let defaultParameters: Parameters = {
    doDuplicateSideCompounds: true,
    doPutAsideSideCompounds: true,

    doReactionReversible: true,

    doMainChain: true,
    getSubgraph : getPathSourcesToTargetNode,
    startNodeTypeMainChain: SourceType.RANK_SOURCE,
    pathType: PathType.ALL_LONGEST,
    merge: true,
    doMiniBranch: true,
    groupOrCluster: "cluster",

    doCycle: true,
    allowInternalCycles: false,
   
    addNodes: true,
    ordering: true,

    dpi: 72,

    numberNodeOnEdge: 3,
    factorLengthSideCompounds: 1/2,

    shiftCoord: true,

    //userSources: [],
    //onlyUserSources: false,
};