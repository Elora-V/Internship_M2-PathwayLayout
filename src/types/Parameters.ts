import { Network } from "@metabohub/viz-core/src/types/Network";
import { PathType, StartNodesType } from "./EnumArgs";
import { getPathSourcesToTargetNode } from "@/composables/LayoutMainChain";

/**
 * This file contains the types for the Parameters object : all parameters for the algorithm.
 * And an default object for the parameters.
 */


export interface Parameters {

    doDuplicateSideCompounds: boolean; // do the step duplicate side compounds ?
    doPutAsideSideCompounds: boolean; // do the step put aside side compounds ?

    doReactionReversible: boolean; // do the step duplication and choice of reaction reversible ?

    doMainChain: boolean; // do the step main chain ?
    getSubgraph : (network: Network, sources: Array<string>,merge?:boolean,pathType?:PathType) => {[key:string]:{nodes:Array<string>, height:number}}; // function to get subgraph (main chain)
    startNodeTypeMainChain: StartNodesType; // for the main chain step : which are the start nodes?
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
    doDuplicateSideCompounds: true, // user can change this parameter
    doPutAsideSideCompounds: true, // user can change this parameter

    doReactionReversible: true, // user can change this parameter

    doMainChain: true, // user can change this parameter
    getSubgraph : getPathSourcesToTargetNode,
    startNodeTypeMainChain: StartNodesType.RANK_SOURCE, // usefull to allow user to change this parameter with RANK_ONLY or SOURCE_ONLY ? (if source-only, put source_all for reaction rev and no first viz)
    pathType: PathType.ALL_LONGEST, // user can change this parameter
    merge: true, // no choice for now, but when edit of algo, add option where no merge and keep the largest subgraph
    doMiniBranch: true, // usefull choice ? run metrix to see if it's usefull
    groupOrCluster: "cluster",

    doCycle: true, // user can change this parameter
    allowInternalCycles: false,
   
    addNodes: true,
    ordering: true,

    dpi: 72,

    numberNodeOnEdge: 3, // user can change this parameter, but doesn't work for cycle edge length
    factorLengthSideCompounds: 1/2, // user can change this parameter

    shiftCoord: true,

    //userSources: [],
    //onlyUserSources: false,
};