
export enum RankEnum {
    SAME = "same",
    SOURCE = "source",
    MIN = "min",
    SINK = "sink",
    MAX = "max",
    EMPTY = ""
}

export interface Cluster {
    name: string;
    rank?: RankEnum;
    classes?: Array<string>;
    nodes: Array<string>;
    Subcluster?: Array<Cluster>;
}




