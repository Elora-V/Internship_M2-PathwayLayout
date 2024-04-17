import { Network } from '@metabohub/viz-core/src/types/Network';
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph, instance } from "@viz-js/viz";
import { Serialized } from 'graph-data-structure';

/** 
 * Take a network object and return a dagre.graphlib.Graph object containing the same nodes and edge 
 * @param {Network}  Network object 
 * @param  graphAttributes for dagre layout (see https://github.com/dagrejs/dagre/wiki)
 * @returns {dagre.graphlib.Graph} Return dagre.graphlib.Graph object 
 */
export function NetworkToDagre(network: Network,graphAttributes={}): dagre.graphlib.Graph{

    // initialisation dagre graph
    var g = new dagre.graphlib.Graph();
    g.setGraph(graphAttributes);
    g.setDefaultEdgeLabel(() => ({}));

    // insert nodes into graph
    Object.values(network.nodes).forEach((node) => {
        const { id, label, x, y } = node;
        g.setNode(id, { label, width: 100, height: 100, x, y });
    });

    // insert edges into graph
    network.links.forEach((link) => {
        const { source, target } = link;
        g.setEdge(source.id, target.id);
    });

    return g;

}


/**
 * Take a network object and return a graph object for viz containing the same nodes and edge 
 * @param {Network}  Network object 
 * @param  graphAttributes for viz dot layout (see https://graphviz.org/docs/layouts/dot/)
 * @returns {Graph} Return graph object for viz
 */
export function NetworkToViz(network: Network, graphAttributes={} ): Graph{
    
    // initialisation viz graph
    const graphViz: Graph ={
        graphAttributes: graphAttributes,
        directed: true,
        edges: [],
        subgraphs:[]
    }

    // insert edges into graph
    graphViz.edges = network.links.map(link => ({
        tail: link.source.id,
        head: link.target.id
    }));

    return graphViz;

}

/**
 * Take a network object and return a serialized object for graph-data-strucutre lib containing the same nodes and edge 
 * @param {Network}  Network object 
 * @returns {Serialized} Return serialized object for graph-data-strucutre
 */
export function NetworkToSerialized(network: Network): Serialized {
    const serializedNodes = Object.values(network.nodes).map(node => ({ id: node.id }));
    const serializedLinks = network.links.map(link => ({
        source: link.source.id,
        target: link.target.id,
        weight: 1 
    }));
    return { nodes: serializedNodes, links: serializedLinks };
}

export function addClusterViz(vizGraph:Graph,name:string, vizNodesList:Array<VizNode>){
    if (!Object.keys(vizGraph).includes("subgraphs")){
        vizGraph.subgraphs=[];
    }
    vizGraph.subgraphs.push({
        name:"cluster_"+name,
        nodes:vizNodesList
    });
    return vizGraph;
}