import { Link } from "@metabohub/viz-core/src/types/Link";
import { Node } from "@metabohub/viz-core/src/types/Node";
import type { Network } from "@metabohub/viz-core/src/types/Network";

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
    metadataLayout?: {[key: string]: string | number | {[key: string]: string | number} | Array<string> | boolean};
}
  
export interface LinkLayout extends Link {
    metadataLayout?: {[key: string]: string | number | {[key: string]: string | number} | Array<string> | boolean};
}