// Graph already accessible, but the other interface can't be exported so there are duplicated here

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

interface Subgraph {
name?: string
graphAttributes?: AttributesViz
nodeAttributes?: AttributesViz
edgeAttributes?: AttributesViz
nodes?: NodeViz[]
edges?: EdgeViz[]
subgraphs?: Subgraph[]
}
