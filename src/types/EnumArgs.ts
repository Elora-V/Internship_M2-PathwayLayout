export enum StartNodesType {
    SOURCE_ONLY = "source_only",
    SOURCE_ALL="source_all",
    RANK_ONLY = "rank_only",
    RANK_SOURCE = "rank_source",
    RANK_SOURCE_ALL="rank_source_all",
    ALL = "all",
}

export enum PathType {
    LONGEST='longest',
    ALL_LONGEST='all_longest',
    ALL='all'
}

export enum Ordering {
    DEFAULT = "",
    IN = "in",
    OUT = "out"
}

export enum Algo{
    DEFAULT,
    FORCE,
    VIZ,
    ALGO, // default : main chain with all longest
    ALGO_V0, // no main chain
    ALGO_V1, // main chain with longest
    ALGO_V3 // main chain with all paths
}

export enum VizArgs{
    RANKSEP="ranksep",
    NODESEP="nodesep",
}