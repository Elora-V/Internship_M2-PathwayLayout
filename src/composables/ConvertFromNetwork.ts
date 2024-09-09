// Type imports
import { Network } from '@metabohub/viz-core/src/types/Network';
import { Subgraph, TypeSubgraph } from '@/types/Subgraph';
import { SubgraphNetwork } from '@/types/SubgraphNetwork';
import { Link } from '@metabohub/viz-core/src/types/Link';
import { LinkLayout, NetworkLayout, NodeLayout } from '@/types/NetworkLayout';
import { Ordering } from '@/types/EnumArgs';

// Composable imports
import { addMainChainClusterViz,addClusterDot } from './useSubgraphs';
import { getSizeNodePixel, pixelsToInches } from './CalculateSize';
import { inCycle } from './GetSetAttributsNodes';
import { cycleMetanodeLink, sortLinksWithAllGroupCycle } from './CalculateRelationCycle';


// General imports
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph } from "@viz-js/viz";
import * as GDS from 'graph-data-structure';
import { h } from 'vue';
import { link } from 'fs';
import { s } from 'vitest/dist/reporters-1evA5lom';
import { get } from 'http';
import cytoscape, { ElementDefinition,Stylesheet } from 'cytoscape';
import { layout } from 'dagrejs';


/**
 * This file contains functions to convert a network object into different formats
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */


/*******************************************************************************************************************************************************/
//___________________________________________________0.  Graph __________________________________________________________________________



/**
 * Convert a network object into a network layout object (network with information to calculate layout)
 * @param network the network object to convert
 * @returns the new network layout object
 */
export function NetworktoNetworkLayout(network: Network): NetworkLayout {
  
    // Convert nodes
    const nodes: { [key: string]: NodeLayout } = Object.keys(network.nodes).reduce(
      (acc, key) => {
        const node = network.nodes[key];
        acc[key] = {
          ...node,
          metadataLayout: {}
        };
        return acc;
      },
      {} as { [key: string]: NodeLayout }
    );
  
    // Convert links
    const links: Array<LinkLayout> = network.links.map(link => ({
      ...link,
      source: nodes[link.source.id], // update of pointer
      target: nodes[link.target.id], // update of pointer
      metadataLayout: {}
    }));
  
    // Convert network to network layout
    const networkLayout: NetworkLayout = {
      ...network,
      nodes,
      links,
    } as NetworkLayout;
  
    return networkLayout;
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
export async function NetworkToGDSGraph(network: Network):Promise<{[key:string]:Function}>{ 
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

/*******************************************************************************************************************************************************/
//___________________________________________________1.  Layout library __________________________________________________________________________



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
 * Converts a network object to a Cytoscape object.
 * 
 * @param network - The network object to convert.
 * @param initialPosition - Optional. Specifies whether to initialize the position of the nodes. Default is false.
 * @returns The converted Cytoscape object.
 */
export function networkToCytoscape(network: Network, initialPosition:boolean=false): cytoscape.Core {

    // Convert nodes
    const nodes: ElementDefinition[] = Object.values(network.nodes).map(node => ({
        data: {
          id: node.id,
        },
        position: {
          x: node.x,
          y: node.y,
        },
      }));
  
    // Convert links
    const edges: ElementDefinition[] = [];
    network.links.forEach(link => {
        edges.push({
        data: {
          id: link.id,
          source: link.source.id,
          target: link.target.id,
        }
      });
    });


    if (initialPosition){
        return cytoscape({
            container: undefined, 
            elements: {nodes:nodes, edges:edges},
            layout: { 
              name: 'preset', // to initialize the position of the nodes
            },
    });
    }else{
        return cytoscape({
        container: undefined, 
        elements: {nodes:nodes, edges:edges},
        });
  }
}


/**
 * Take a network object and return a graph object for viz containing the same nodes and edge 
 * @param {Network}  Network object 
 * @param  graphAttributes for viz dot layout (see https://graphviz.org/docs/layouts/dot/)
 * @param clusters clusters for viz
 * @returns {Graph} Return graph object for viz
 */
export function NetworkToViz(subgraphNetwork:SubgraphNetwork,cycle:boolean=true, addNodes:boolean=true,groupOrCluster:"group"|"cluster"="cluster",orderChange:boolean=false): Graph{

    if (groupOrCluster==="group" && !addNodes){
        console.warn('Group without nodes in the file not taken into account'); 
    }else if (groupOrCluster==="cluster" && orderChange){
        console.warn('When ordering and cluster : cluster is prioritized over ordering');
    }

    // initialisation viz graph
    let graphViz: Graph ={
        graphAttributes: subgraphNetwork.attributs,
        directed: true,
        edges: [],
        nodes: [],
        subgraphs:[]
    }

    // insert nodes 
    if (addNodes){
        Object.entries(subgraphNetwork.network.value.nodes)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .forEach(([key, node])=> { 
            // if not in metanode, that is, not in cycle :
            if (!inCycle(subgraphNetwork.network.value,node.id)){
                const attributes:AttributesViz={};
                // size of node in inches
                const sizeNode= getSizeNodePixel(node,subgraphNetwork.networkStyle.value);
                attributes.height=pixelsToInches(sizeNode.height);
                attributes.width=pixelsToInches(sizeNode.width);
                attributes.fixedsize=true;
                // if main chain : add group attribut
                if (groupOrCluster==="group"){
                    if (node.metadataLayout && node.metadataLayout[TypeSubgraph.MAIN_CHAIN]){
                        const mainChain=node.metadataLayout[TypeSubgraph.MAIN_CHAIN];
                        if (mainChain.length!==0){
                            attributes.group=mainChain[0]; // can't be in several main chain
                        }
                    }
                }
                graphViz.nodes.push({name:node.id,attributes:attributes});
            }       
        });
    }
    
    // order of edge changed :
    let links:LinkLayout[]=[];
    const resultOrdering=sortLinksWithAllGroupCycle(subgraphNetwork,orderChange);
    links=resultOrdering.linksOrdered;
    subgraphNetwork=resultOrdering.subgraphNetwork; // BEWARE: do this before adding cycle metanode (because of attribut ordering)

    // insert edge (but with cycle metanode if cycle is true) 
    links.forEach((link)=>{   

        // get tail and head (take into account cycle metanode)
        const {tail,head}=cycleMetanodeLink(link,cycle);
        if (tail!== undefined && head!==undefined ) throw new Error("tail and head aren't defined");

        // add edge (tail and head) if not already in graphviz, and not same node   
        if (tail!==head &&  !graphViz.edges.some(edge => edge.tail === tail && edge.head === head)){
            graphViz.edges.push({
                tail: tail,
                head: head,
            });
        }

    });
        

    // insert mainChain cluster 
    if (groupOrCluster==="cluster" && Object.keys(subgraphNetwork).includes(TypeSubgraph.MAIN_CHAIN)){
        Object.keys(subgraphNetwork.mainChains).sort((a, b) => subgraphNetwork.mainChains[b].nodes.length - subgraphNetwork.mainChains[a].nodes.length) // sort depending on size : bigger first
            .forEach((nameMainChain) => {
                graphViz=addMainChainClusterViz(graphViz,nameMainChain,subgraphNetwork,cycle);
        });
    }

    // insert cycle metanode
    if (cycle && subgraphNetwork.cyclesGroup){
        Object.values(subgraphNetwork.cyclesGroup).sort((a, b) => { // sort depending on size : bigger first
            const areaB = b.width * b.height;
            const areaA = a.width * a.height;
            return areaB - areaA;
        })
        .forEach((cycle) => {
            const height=pixelsToInches(cycle.height);
            const width=pixelsToInches(cycle.width);
            let ordering=Ordering.DEFAULT;
            if(orderChange){
                ordering=cycle.ordering;
            }
            graphViz.nodes.push({name:cycle.name, attributes:{height:height,width:width,ordering:ordering,fixedsize:true}});
        });
    }
    return graphViz;
}

export function NetworkToDot(vizGraph:Graph, subgraphFirst:boolean=true):string{
    // initialisation viz graph with graph attributs
    let dotString="strict digraph G {\n graph "+customStringify(vizGraph.graphAttributes)+"\n";
    
    if (subgraphFirst){
        // clusters
        vizGraph.subgraphs.forEach((subgraph) => {
            dotString+=addClusterDot(subgraph as SubgraphViz);
        });

        // nodes 
        vizGraph.nodes.forEach((node) => {
            const nodeAttributes= customStringify(node.attributes);
            dotString+=`${node.name}  ${nodeAttributes};\n`;
        });

        // edges 
        vizGraph.edges.forEach((edge) => {
            dotString+=`${edge.tail} -> ${edge.head};\n`;
        });
    } else {

        // nodes 
        vizGraph.nodes.forEach((node) => {
            const nodeAttributes= customStringify(node.attributes);
            dotString+=`${node.name}  ${nodeAttributes};\n`;
        });
        // edges 
        vizGraph.edges.forEach((edge) => {
            dotString+=`${edge.tail} -> ${edge.head};\n`;
        });

        // clusters
        vizGraph.subgraphs.forEach((subgraph) => {
            dotString+=addClusterDot(subgraph as SubgraphViz);
        });
    }
    
    return dotString+"}";
}


/**
 * Converts an object into a custom string representation.
 * 
 * @param obj - The object to be converted.
 * @returns The custom string representation of the object.
 */
function customStringify(obj) {
    if (Object.keys(obj).length === 0) {
        return "";
    }
    let str = '[';
    for (let key in obj) {
        str += `${key}="${obj[key]}", `;
    }
    str = str.slice(0, -2); // remove trailing comma and space
    str += ']';
    return str;
}





// /**
//  * Return a copy of the network
//  * @param network 
//  * @returns a copy of the network
//  */
// export function networkCopy(network: Network): Network {
//     const newNetwork: Network = {
//         id: network.id,
//         label: network.label,
//         nodes: {},
//         links: []
//     };

//     Object.keys(network.nodes).forEach(key=>{  
//         newNetwork.nodes[key] = Object.assign({}, network.nodes[key]);   
//     })

//     network.links.forEach(item=>{
//         //get all info from links
//         const newlink=Object.assign({}, item);
//         // update the node to have a pointeur
//         newlink.source=newNetwork.nodes[item.source.id];
//         newlink.target=newNetwork.nodes[item.target.id];
//         newNetwork.links.push(newlink);
//     });
//     return newNetwork;
// }

