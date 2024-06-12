import { Network } from '@metabohub/viz-core/src/types/Network';
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph } from "@viz-js/viz";
import { addMainChainClusterViz } from './useSubgraphs';
import { Subgraph, TypeSubgraph } from '@/types/Subgraph';
import { addClusterDot } from './useSubgraphs';
import * as GDS from 'graph-data-structure';
import { SubgraphNetwork } from '@/types/SubgraphNetwork';
import { h } from 'vue';
import { Link } from '@metabohub/viz-core/src/types/Link';


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
export function NetworkToViz(subgraphNetwork:SubgraphNetwork,cycle:boolean=true): Graph{
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
        //attributs.minlen=3;
       

        // get tail and head (take into account cycle metanode)
        const {tail,head}=cycleMetanodeLink(link,subgraphNetwork,cycle);


        // if (inCycle){
        //     const lengthToCentroid=Math.round(subgraphNetwork.cycles[inCycle].nodes.length/4)+1; // to test
        //     //attributs.minlen=lengthToCentroid;
        // }

        // add edge (tail and head) if not already in graphviz   
        if ( tail!== undefined && head!==undefined && tail!==head &&  !graphViz.edges.some(edge => edge.tail === tail && edge.head === head)){
            graphViz.edges.push({
                tail: tail,
                head: head,
                attributes:attributs
            });
        }

    });
        

    // insert mainChain subgraphs 
    Object.keys(subgraphNetwork.mainChains).sort((a, b) => subgraphNetwork.mainChains[b].nodes.length - subgraphNetwork.mainChains[a].nodes.length) // sort depending on size : bigger first
        .forEach((nameMainChain) => {
            graphViz=addMainChainClusterViz(graphViz,nameMainChain,subgraphNetwork,cycle);
    });

    // insert cycle metanode
    if (cycle && subgraphNetwork.cyclesGroup){
        Object.values(subgraphNetwork.cyclesGroup).sort((a, b) => { // sort depending on size : bigger first
            const areaB = b.width * b.height;
            const areaA = a.width * a.height;
            return areaB - areaA;
        })
        .forEach((cycle) => {
            const height=cycle.height;
            const width=cycle.width;
            const factor=0.015;
            graphViz.nodes.push({name:cycle.name, attributes:{height:factor*height,width:factor*width}});
        });
    }
    return graphViz;
}

export function NetworkToDot(vizGraph:Graph, subgraphFirst:boolean=true):string{
    // initialisation viz graph with graph attributs
    let dotString="strict digraph G {\n graph "+customStringify(vizGraph.graphAttributes)+"\n";

    // nodes (metanodes only)
    vizGraph.nodes.forEach((node) => {
        const nodeAttributes= customStringify(node.attributes);
        dotString+=`${node.name}  ${nodeAttributes};\n`;
    });
    
    if (subgraphFirst){
        // clusters
        vizGraph.subgraphs.forEach((subgraph) => {
            dotString+=addClusterDot(subgraph as SubgraphViz);
        });

        // edges 
        vizGraph.edges.forEach((edge) => {
            dotString+=`${edge.tail} -> ${edge.head} `+customStringify(edge.attributes)+`;\n`;
        });
    } else {
        // edges 
        vizGraph.edges.forEach((edge) => {
            dotString+=`${edge.tail} -> ${edge.head} `+customStringify(edge.attributes)+`;\n`;
        });

        // clusters
        vizGraph.subgraphs.forEach((subgraph) => {
            dotString+=addClusterDot(subgraph as SubgraphViz);
        });
    }
    
    return dotString+"}";
}

// export function NetworkToDot(subgraphNetwork:SubgraphNetwork,cycle:boolean=true,radiusFactor:number=15): string{

//     const network=subgraphNetwork.network.value;
//     // initialisation viz graph with graph attributs
//     let dotString="digraph G {\n graph "+customStringify(subgraphNetwork.attributs)+"\n";

//     // insert nodes if special viz attributs
//     Object.values(network.nodes).forEach((node) => {
//         if(node.metadata["vizAttributs"]){
//             const vizAttributes= customStringify(node.metadata["vizAttributs"]);
//             dotString+=`${node.id} `+vizAttributes+`;\n`;
//         }
//     });

//     // insert cycle metanode
//     if (cycle && subgraphNetwork.cycles){
//         Object.keys(subgraphNetwork.cycles).forEach((cycle) => {
//             const size = Math.floor(subgraphNetwork.cycles[cycle].nodes.length*radiusFactor*2/80); // test
//             dotString+=`${cycle} [width=${size}, height=${size}]; \n`;
//         });
//     }


//     // insert edges 
//     network.links.forEach((link)=>{
//         // link attributs
//         let attributs:AttributesViz={};
//         if (link.metadata && Object.keys(link.metadata).includes("constraint")){
//             attributs.constraint=link.metadata["constraint"] as boolean;
//         }
//         // head and tail
//         let tail:string=link.source.id;
//         let head:string=link.target.id;
//         let inCycle:string;
        
//          // get new tail and head if in cycle metanode
//         const newLinks=cycleMetanodeLink(link,subgraphNetwork);
//             newLinks.forEach(newLink=>{
//                 inCycle=newLink.inCycle;
//                 tail=newLink.tail;
//                 head=newLink.head;

//                 if (inCycle){
//                     const lengthToCentroid=Math.round(subgraphNetwork.cycles[inCycle].nodes.length/4)+1; // to test
//                     attributs.minlen=lengthToCentroid;
//                 }
//                 if (tail!==head){
//                     dotString+=`${tail} -> ${head} `+customStringify(attributs)+`;\n`; // to change bcs several time the same link between cycle
//                 }
//             });

//     });

//     // insert subgraphs (with edges)
//     Object.values(subgraphNetwork.mainChains).forEach((nameMainChain) => {
//         dotString+=addClusterDot(nameMainChain);
//     });

      
//     return dotString+"}";

// }

function cycleMetanodeLink(link:Link, subgraphNetwork:SubgraphNetwork,cycle:boolean=true):{inCycle:string[],tail:string,head:string}{
    
    let inCycle:string[]=[];
    let tail:string;
    let head:string;
    let newLink:{inCycle:string[],tail:string,head:string};

     // source in cycleMetanode ?
    if(cycle && link.source.metadata && Object.keys(link.source.metadata).includes(TypeSubgraph.CYCLEGROUP) && link.source.metadata[TypeSubgraph.CYCLEGROUP][0]){
        tail=link.source.metadata[TypeSubgraph.CYCLEGROUP] as string;  
        inCycle.push(tail);
    }else{
        tail=link.source.id;
    }

    // target in cycleMetanode ?
    if(cycle && link.target.metadata && Object.keys(link.target.metadata).includes(TypeSubgraph.CYCLEGROUP) && link.target.metadata[TypeSubgraph.CYCLEGROUP][0]){
        head=link.target.metadata[TypeSubgraph.CYCLEGROUP] as string;  
        inCycle.push(head);
    }else{
        head=link.target.id;
    }
    
    // if tail and head  are differents
    if (tail!==head){
        newLink={inCycle:inCycle,tail:tail,head:head};
    }else{
        newLink={inCycle:undefined,tail:undefined,head:undefined};
    }
    return newLink;
}

export function inBiggerCycle(cycleName:string,subgraphNetwork:SubgraphNetwork):string{
    if (subgraphNetwork.cycles[cycleName].forSubgraph && subgraphNetwork.cycles[cycleName].forSubgraph.type==TypeSubgraph.CYCLE){
            return subgraphNetwork.cycles[cycleName].forSubgraph.name;
    }else{ 
        return cycleName;
    }
}

function listOfCycles(cycleList:string[],subgraphNetwork:SubgraphNetwork):string[]{
    const newCyclesList=[];
    cycleList.forEach(cycle=>{
        // if cycle is a 'child' of another cycle : no new metanode, it is considered as the parent cycle metanode (else it is the cycle)
        const biggerCycle=inBiggerCycle(cycle,subgraphNetwork); 
        if (!newCyclesList.includes(biggerCycle)){
            newCyclesList.push(biggerCycle);
        }
    });
    return newCyclesList;
}

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

