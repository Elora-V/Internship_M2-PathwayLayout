import { Network } from '@metabohub/viz-core/src/types/Network';
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph } from "@viz-js/viz";
import { addMainChainClusterViz } from './useSubgraphs';
import { Subgraph, TypeSubgraph } from '@/types/Subgraph';
import * as GDS from 'graph-data-structure';
import { SubgraphNetwork } from '@/types/SubgraphNetwork';
import { h } from 'vue';


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
 * @returns {Graph} Return graph object for viz
 */
export function NetworkToViz(subgraphNetwork:SubgraphNetwork,cycle:boolean=true,radiusFactor:number=15): Graph{
    // initialisation viz graph
    let graphViz: Graph ={
        graphAttributes: subgraphNetwork.attributs,
        directed: true,
        edges: [],
        nodes: [],
        subgraphs:[]
    }

    // insert nodes
    // Object.keys(subgraphNetwork.network.value.nodes).forEach((node) => { 
    //     graphViz.nodes.push({name:node});
    // });

    
    // insert edge (but with cycle metanode) 
    subgraphNetwork.network.value.links.forEach((link)=>{


        // attributs
        let attributs:AttributesViz={};
        if (link.metadata && Object.keys(link.metadata).includes("constraint")){
            attributs.constraint=link.metadata["constraint"] as boolean;
        }

        // head and tail
        let tail:string=link.source.id;
        let head:string=link.target.id;

        // if cycle handling
        if (cycle){
            let inCycle:string;
            // source in cycle ?
            if(link.source.metadata && Object.keys(link.source.metadata).includes(TypeSubgraph.CYCLE)){
                const cyclesOfSource=link.source.metadata[TypeSubgraph.CYCLE];
                if(Object.keys(cyclesOfSource).length>1){
                    console.error("A node can't be in multiple cycle");
                }else if (Object.keys(cyclesOfSource).length==1){
                    tail=cyclesOfSource[0]; // tail is the cycle
                    inCycle=tail;
                }          
            }
            // target in cycle ?
            if(link.target.metadata && Object.keys(link.target.metadata).includes(TypeSubgraph.CYCLE)){
                const cyclesOfTarget=link.target.metadata[TypeSubgraph.CYCLE];
                if(Object.keys(cyclesOfTarget).length>1){
                    console.error("A node can't be in multiple cycle");
                }else if (Object.keys(cyclesOfTarget).length==1){
                    head=cyclesOfTarget[0]; // head is the cycle
                    inCycle=head;
                }          
            }

            if(inCycle !== undefined){
                // const cycleLength=subgraphNetwork.cycles[inCycle].nodes.length;
                // const diameterCycle=cycleLength*radiusFactor*2;
                // const sizeMetanode=1;//diameterCycle/500;
                graphViz.nodes.push({name:inCycle});//attributes:{height:sizeMetanode,width:sizeMetanode}
            }
    
        }
        
        // add edge        
        if (tail!=head){
            graphViz.edges.push({
                tail: tail,
                head: head,
                attributes:attributs
            });
        }
    })

    // insert mainChain subgraphs (with edges)
    Object.keys(subgraphNetwork.mainChains).forEach((nameMainChain) => {
        graphViz=addMainChainClusterViz(graphViz,nameMainChain,subgraphNetwork);
    });

    return graphViz;

}


/**
 * Take a network object and return a serialized object for graph-data-strucutre lib containing the same nodes and edge 
 * @param {Network}  Network object 
 * @returns {Serialized} Return serialized object for graph-data-strucutre
 */
export function NetworkToSerialized(network: Network): GDS.Serialized {
    const serializedNodes = Object.values(network.nodes).map(node => ({ id: node.id }));
    const serializedLinks = network.links.map(link => ({
        source: link.source.id,
        target: link.target.id,
        weight: 1 
    }));
    return { nodes: serializedNodes, links: serializedLinks };
}


/**
 * Take a network object and return a graph for graph-data-structure
 * @param network 
 * @returns Graph object as {[key:string]:Function}
 */
export function NetworkToGDSGraph(network: Network):{[key:string]:Function}{ 
    const graph = GDS.Graph();
    const networkSerialized: GDS.Serialized = NetworkToSerialized(network);
    graph.deserialize(networkSerialized);
    return graph;
}


/**
 * Convert a network into an adjacency object.
 * @param network The network to convert.
 * @returns An adjacency object representing the network : an object with nodes as key, and children of node as values
 */
export function NetworkToAdjacentObject(network:Network):{[key : string]:string[]}{
    const adjacence:{[key : string]:string[]}={};
    Object.keys(network.nodes).forEach(node=>{
        if (!(node in Object.keys(adjacence))){
            adjacence[node]=[];
        }
    })
    network.links.forEach(link=>{
        const source=link.source.id;
        const target=link.target.id;
        adjacence[source].push(target);
    });
    return adjacence;
}

/**
 * Return a copy of the network
 * @param network 
 * @returns a copy of the network
 */
export function networkCopy(network: Network): Network {
    const newNetwork: Network = {
        id: network.id,
        label: network.label,
        nodes: {},
        links: []
    };

    Object.keys(network.nodes).forEach(key=>{  
        newNetwork.nodes[key] = Object.assign({}, network.nodes[key]);   
    })

    network.links.forEach(item=>{
        //get all info from links
        const newlink=Object.assign({}, item);
        // update the node to have a pointeur
        newlink.source=newNetwork.nodes[item.source.id];
        newlink.target=newNetwork.nodes[item.target.id];
        newNetwork.links.push(newlink);
    });
    return newNetwork;
}

