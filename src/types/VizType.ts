// Graph already accessible (see the format below, but implemented in library), but the other interface can't be exported so there are duplicated here
// export interface Graph {
//     name?: string
//     strict?: boolean
//     directed?: boolean
//     graphAttributes?: Attributes
//     nodeAttributes?: Attributes
//     edgeAttributes?: Attributes
//     nodes?: Node[]
//     edges?: Edge[]
//     subgraphs?: Subgraph[]
//   }

interface AttributesViz {
    [name: string]: string | number | boolean 
  }
  
interface NodeViz {
name: string
attributes?: AttributesViz
}

interface EdgeViz {
tail: string
head: string
attributes?: AttributesViz
}

interface SubgraphViz {
name?: string
graphAttributes?: AttributesViz
nodeAttributes?: AttributesViz
edgeAttributes?: AttributesViz
nodes?: NodeViz[]
edges?: EdgeViz[] 
subgraphs?: SubgraphViz[]
}

// version of SubgraphViz modified to quicker search (with object instead of array for edge)
interface SubgraphObject {
    name?: string
    classes?:Array<string> // adding classes 
    graphAttributes?: AttributesViz
    nodeAttributes?: AttributesViz
    edgeAttributes?: AttributesViz
    nodes?: {[key:string]:NodeViz} // adding object format to allow rapid search by node name
    edges?: EdgeViz[]
    subgraphs?: SubgraphViz[]
    }
