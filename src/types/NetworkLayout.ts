import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import type { Network } from "@metabohub/viz-core/src/types/Network";
import { TypeSubgraph } from "./Subgraph";

/**
 * This file contains the types for the NetworkLayout object : a network with nodes and links information and metadataLayout for nodes and links.
 * MetadataLayout is used to store the information to calculate the layout.
 */

export interface NetworkLayout extends Network {
    nodes: {
      [key: string]: NodeLayout; 
    };
    links: Array<LinkLayout>; 
  }


export interface NodeLayout extends Node {
    metadataLayout?: {
      rank? : number;
      order? : number;
      reversibleNodeVersion? : string; // id of the duplicated version of the node (the reversed node)
      isReversedVersion? : boolean; // true if is the duplicated version, false if original node
     [TypeSubgraph.MAIN_CHAIN]?:string[],
     [TypeSubgraph.SECONDARY_CHAIN]?:string[],
     [TypeSubgraph.CYCLE]?:string[],
     [TypeSubgraph.CYCLEGROUP]?:string[],
    }
}
  

export interface LinkLayout extends Link {
    metadataLayout?: {[key: string]: string | number | {[key: string]: string | number} | Array<string> | boolean};
}