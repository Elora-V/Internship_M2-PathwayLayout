interface DFS {
    dfsOrder: Array<string>
    GDSgraph: {[key:string]:Function} // Graph with a format for lib Graph Data Structure
    nodesID:Array<string>
    visited:Array<boolean>
}