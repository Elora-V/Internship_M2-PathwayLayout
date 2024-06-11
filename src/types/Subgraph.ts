
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
    // if subgraph associated with another subgraph (like secondary chain associated with a main chain)
    forSubgraph?: {name:string,type:TypeSubgraph}; // the "parent" subgraph
    associatedSubgraphs?: Array<{name:string,type:TypeSubgraph}>; // the "children" subgraphs
    rank?:string;
    width?:number;
    height?:number;
    position?:{x:number,y:number};
    originCoordinates?:{x:number,y:number}; // if metanode : the metanode center not well positionned
    metadata?: {[key: string]: string | number| boolean | {[key: string]: string | number} | Array<string>};
}




