import { Network } from '@metabohub/viz-core/src/types/Network';
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph, instance } from "@viz-js/viz";
import { Serialized } from 'graph-data-structure';
import { object } from 'prop-types';
import { addClusterViz } from './modifyVizGraph';
import cluster from 'cluster';

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
 * @param clusters clusters for viz
 * @param edgeInCluster true if edge are placed inside the right clusters, false if all edges in the general graph
 * @returns {Graph} Return graph object for viz
 */
export function NetworkToViz(network: Network,clusters:Array<SubgraphObject>=[],graphAttributes={}, edgeInCluster:boolean=false ): Graph{
    // initialisation viz graph
    let graphViz: Graph ={
        graphAttributes: graphAttributes,
        directed: true,
        edges: [],
        subgraphs:[]
    }

    // insert edge in cluster or general graph
    network.links.forEach((link)=>{
        let notInCluster=true;
        // if edge need to be placed inside clusters :
        if(edgeInCluster){
            // adding edges in cluster if source and target node in cluster
            clusters.forEach((cluster)=>{
                if (link.source.id in cluster.nodes && link.target.id in cluster.nodes){
                    notInCluster=false;
                    cluster.edges.push({
                        tail: link.source.id,
                        head: link.target.id,
                    });
                }
            });
        }
        //if the edge is associated with no cluster: put it in the general graph
        if (notInCluster){
            graphViz.edges.push({
                tail: link.source.id,
                head: link.target.id,
              });
        }
    })

    // insert subgraphs (with edges)
    clusters.forEach((cluster) => {
        graphViz=addClusterViz(graphViz,cluster);
    });
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

