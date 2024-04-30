interface DFS {
    time:number
    dfsOrder: Array<string>
    GDSgraph: {[key:string]:Function}
    nodesID:Array<string>
    visited:Array<boolean>
    start_time:Array<number>
    end_time:Array<number>
    crossEdge:Array<{source:string,target:string}>
}