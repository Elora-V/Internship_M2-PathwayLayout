export enum SourceType {
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

export enum Algo{
    DEFAULT,
    FORCE,
    VIZ,
    ALGO,
    ALGO_V0,
    ALGO_V1,
    ALGO_V3
}