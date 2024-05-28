
export enum TypeSubgraph {
    MAIN_CHAIN = "mainChains",
    SECONDARY_CHAIN = "secondaryChains",
    CYCLE = "cycles"
}

export interface Subgraph {
    name: string;
    classes?: Array<string>;
    nodes: Array<string>;
    type?: TypeSubgraph;
    rank:string;
}




