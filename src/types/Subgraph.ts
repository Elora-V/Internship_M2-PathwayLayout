import { Coordinate } from "./CoordinatesSize";
import { Ordering } from "./EnumArgs";

/**
 * This file contains the types for the Subgraph object : main chain, secondary chain, cycle and cycle group.
 * A subgraph can be considered as a metanode in the network. Its width and height are the width and height of the rectangle containing the metanode.
 * Its position is the center of the rectangle, and the originalPosition is the position of the center of the metanode before the layout (when coordinates precalculated).
 */

export enum TypeSubgraph {
    MAIN_CHAIN = "mainChains",
    SECONDARY_CHAIN = "secondaryChains",
    CYCLE = "cycles",
    CYCLEGROUP="cyclesGroup"
}

export interface Subgraph {
    name: string;
    classes?: Array<string>;
    nodes: Array<string>;
    type?: TypeSubgraph;

    // if subgraph associated with another subgraph (like secondary chain associated with a main chain) :
    parentSubgraph?: {name:string,type:TypeSubgraph}; // the "parent" subgraph
    childrenSubgraphs?: Array<{name:string,type:TypeSubgraph}>; // the "children" subgraphs

    rank?:string;
    ordering?:Ordering;

    width?:number;
    height?:number;
    position?:Coordinate;
    originalPosition?:Coordinate; // if metanode : the metanode center not well positionned (precalulated position)

    precalculatedNodesPosition: {[key: string]: Coordinate}; // if metanode : the position of the nodes in the metanode
    
    metadata?: {[key: string]: string | number| boolean | {[key: string]: string | number} | Array<string>};
}




