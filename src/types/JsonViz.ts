export interface JsonViz {
    directed?: boolean,
    edges:Array<EdgeViz>,
    objects:Array<ObjectsViz>
}

interface EdgeViz {
    tail: string,
    head: string,
    attributes?: Attributes
  }

interface ObjectsViz {
    name: string,
    pos?: string,
}

interface Attributes {
[name: string]: string | number | boolean 
}