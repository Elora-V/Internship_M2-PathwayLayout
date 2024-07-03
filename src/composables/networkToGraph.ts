import { Network } from '@metabohub/viz-core/src/types/Network';
import  dagre  from 'dagrejs/dist/dagre.js';
import { Graph } from "@viz-js/viz";
import { addMainChainClusterViz } from './useSubgraphs';
import { Ordering, Subgraph, TypeSubgraph } from '@/types/Subgraph';
import { addClusterDot } from './useSubgraphs';
import * as GDS from 'graph-data-structure';
import { SubgraphNetwork } from '@/types/SubgraphNetwork';
import { h } from 'vue';
import { Link } from '@metabohub/viz-core/src/types/Link';
import { getNodesIDPlacedInGroupCycle, inCycle, neighborsGroupCycle } from './drawCycle';
import { link } from 'fs';
import { s } from 'vitest/dist/reporters-1evA5lom';


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
export function NetworkToViz(subgraphNetwork:SubgraphNetwork,cycle:boolean=true, addNodes:boolean=false,groupOrCluster:"group"|"cluster"="cluster",orderChange:boolean=false): Graph{

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

    // insert nodes if use group
    if (addNodes){
        Object.entries(subgraphNetwork.network.value.nodes)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .forEach(([key, node])=> { 
            // if not in metanode, that is, not in cycle :
            if (!inCycle(subgraphNetwork.network.value,node.id)){
                const attributes:AttributesViz={};
                // if main chain : add group attribut
                if (groupOrCluster==="group"){
                    if (node.metadata && node.metadata[TypeSubgraph.MAIN_CHAIN]){
                        const mainChain=node.metadata[TypeSubgraph.MAIN_CHAIN] as string[];
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
    let links:Link[]=[];
    links=sortLinksWithAllGroupCycle(subgraphNetwork,orderChange);

    // insert edge (but with cycle metanode if cycle is true) 
    links.forEach((link)=>{

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
        

    // insert mainChain cluster 
    if (groupOrCluster==="cluster"){
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
            const height=cycle.height;
            const width=cycle.width;
            const factor=0.015;
            let ordering=Ordering.DEFAULT;
            if(orderChange){
                ordering=cycle.ordering;
            }
            graphViz.nodes.push({name:cycle.name, attributes:{height:factor*height,width:factor*width,ordering:ordering}});
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
            dotString+=`${edge.tail} -> ${edge.head} `+customStringify(edge.attributes)+`;\n`;
        });
    } else {

        // nodes 
        vizGraph.nodes.forEach((node) => {
            const nodeAttributes= customStringify(node.attributes);
            dotString+=`${node.name}  ${nodeAttributes};\n`;
        });
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

function sortLinksWithAllGroupCycle(subgraphNetwork:SubgraphNetwork,orderChange:boolean=false):Link[]{
    let links:Link[]=[];

    // change ordre with group cycle
    if (orderChange  && subgraphNetwork.cyclesGroup){
        console.log('Change order');
        
        // adding edge in right order for each group cycle
        Object.keys(subgraphNetwork.cyclesGroup).forEach((groupCycle) => {
            links=links.concat(sortLinksWithGroupCycle(subgraphNetwork,groupCycle));
        });
        // add other links
        Object.values(subgraphNetwork.network.value.links).forEach((link) => {
            if (!links.includes(link)){
                links.push(link);
            }
        });

        return links;
    
    }else{ // no change
        return subgraphNetwork.network.value.links;
    }
}

function sortLinksWithGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycle:string):Link[]{
    let links:Link[]=[];
    if( groupCycle in subgraphNetwork.cyclesGroup){
        // sort parent of cycle by x of the child in the cycle
        // (first : parent of the left node of group cycle)
        const parents=neighborsGroupCycle(subgraphNetwork,groupCycle,"parent");
        const children=neighborsGroupCycle(subgraphNetwork,groupCycle,"child");
        let nodeOrder:string[]=[];
        let source:"node"|"groupCycle";

        // if more parent than children : order parent
        if (parents.length>=children.length){
            nodeOrder=parents;
            source="node";
            subgraphNetwork.cyclesGroup[groupCycle].ordering=Ordering.IN;
        }else{
            // order children
            nodeOrder=children;
            source="groupCycle";
            subgraphNetwork.cyclesGroup[groupCycle].ordering=Ordering.OUT;
        }

        // get links between the parent (or children) and the group cycle in the right order
        nodeOrder.forEach((nodeId) => {
            // get links for each node
            const newLinksOrder = getLinksNodeGroupCycle(subgraphNetwork,nodeId,groupCycle,source);
            // add links
            newLinksOrder.forEach((newLink) => {
                links.push(newLink);
            });

        });
        return links;
    }else{
        return [];
    }
}


function getLinksNodeGroupCycle(subgraphNetwork:SubgraphNetwork,nodeId:string,groupCycleId:string,source:"node"|"groupCycle"){
    if (source==="node"){
        // node to group cycle
        return Object.values(subgraphNetwork.network.value.links).filter((link) => {
            return link.source.id === nodeId && link.target.metadata && TypeSubgraph.CYCLEGROUP in link.target.metadata && link.target.metadata[TypeSubgraph.CYCLEGROUP] === groupCycleId;
        });
    }else{
        // group cycle to node
        return Object.values(subgraphNetwork.network.value.links).filter((link) => {
            return link.target.id === nodeId && link.source.metadata && TypeSubgraph.CYCLEGROUP in link.source.metadata && link.source.metadata[TypeSubgraph.CYCLEGROUP] === groupCycleId;
        });
    }
    
}


function getLinkParent2GroupCycle(subgraphNetwork:SubgraphNetwork,parentId:string,groupCycle:string){
    return Object.values(subgraphNetwork.network.value.links).filter((link) => {
        return link.source.id === parentId && link.target.metadata && TypeSubgraph.CYCLEGROUP in link.target.metadata && link.target.metadata[TypeSubgraph.CYCLEGROUP] === groupCycle;
    });
}

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

