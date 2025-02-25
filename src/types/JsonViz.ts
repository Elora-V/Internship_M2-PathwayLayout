

export interface JsonViz {
    directed?: boolean,
    edges:Array<EdgeViz>,
    objects:Array<ObjectsViz>
}

interface ObjectsViz { 
    name: string,
    pos?: string,
    bb?: string,
    nodes?:Array<number> // the index in the JsonViz.objects for all nodes
}
