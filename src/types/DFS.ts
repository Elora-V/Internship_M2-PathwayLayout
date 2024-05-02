interface DFS {
    time:number
    dfsOrder: Array<string>
    GDSgraph: {[key:string]:Function}
    nodesID:Array<string>
    visitedFrom:Array<string>
    start_time:Array<number>
    end_time:Array<number>
    crossEdge:{[key:string]:Array<{source:string,target:string}>}
}