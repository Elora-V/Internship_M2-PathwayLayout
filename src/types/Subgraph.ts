
export enum TypeSubgraph {
    MAIN_CHAIN = "mainChains",
    SECONDARY_CHAIN = "secondaryChains",
    CYCLE = "cycles",
    CYCLEGROUP="cyclesGroup"
}

export enum Ordering {
    DEFAULT = "",
    IN = "in",
    OUT = "out"
}

export interface Subgraph {
    name: string;
    classes?: Array<string>;
    nodes: Array<string>;
    type?: TypeSubgraph;
    // if subgraph associated with another subgraph (like secondary chain associated with a main chain)
    parentSubgraph?: {name:string,type:TypeSubgraph}; // the "parent" subgraph
    childrenSubgraphs?: Array<{name:string,type:TypeSubgraph}>; // the "children" subgraphs
    rank?:string;
    width?:number;
    height?:number;
    position?:{x:number,y:number};
    originalPosition?:{x:number,y:number}; // if metanode : the metanode center not well positionned (precalulated position)
    ordering?:Ordering;
    metadata?: {[key: string]: string | number| boolean | {[key: string]: string | number} | Array<string>};
}




