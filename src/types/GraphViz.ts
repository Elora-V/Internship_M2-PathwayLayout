
export type GraphViz = {
    graphAttributes: GraphAttributes,
    directed: boolean,
    edges: Array<LinkViz>
}

export type LinkViz={ 
    tail: string, 
    head: string 
}

// arguments : https://graphviz.org/docs/layouts/dot/

type RankDir = "TB" | "LR" | "BT" | "RL";
type ClusterRank = "local" | "global" | "none";
type RankType = "same" | "min" | "source" | "max" | "sink";

export interface GraphAttributes {
    rankdir?: RankDir;
    clusterrank?: ClusterRank;
    rank?: RankType;
    ranksep? : number | string;
    compound? : boolean;
    constraint? : boolean;
    group? : string;
    lhead?: string;
    ltail?:string;
    mclimit?: number;
    minlen?:number;
    newrank?:boolean;
    nslimit?: number;
    ordering?:string;
    remincross?:boolean;
    samehead?:string;
    sametail?:string;
    searchsize?: number;
    showboxes?: number;
    TBbalance?:string;
}

