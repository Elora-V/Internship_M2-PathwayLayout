export type GraphViz = {
    graphAttributes : object,
    directed: boolean,
    edges: Array<EdgeViz>
}

export type EdgeViz= {
    tail : string,
    head : string
}
