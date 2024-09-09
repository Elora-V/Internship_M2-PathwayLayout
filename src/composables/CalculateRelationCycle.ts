// Type imports
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Link } from "@metabohub/viz-core/src/types/Link";
import { Ordering } from "@/types/EnumArgs";
import { TypeSubgraph } from "@/types/Subgraph";
import { LinkLayout, NetworkLayout } from "@/types/NetworkLayout";


// Composable imports
import { inCycle } from "./GetSetAttributsNodes";


/**
 * This file contains functions to calculate the order of links for the cycle metanodes.
 * 
 * 
 */



/*******************************************************************************************************************************************************/
//___________________________________________________0. Get nodes __________________________________________________________________________



export function neighborsGroupCycle(subgraphNetwork:SubgraphNetwork,cycleGroupId:string, parentOrChild:"parent"|"child",xSort:boolean=true):string[]{
    if (cycleGroupId in subgraphNetwork[TypeSubgraph.CYCLEGROUP] && subgraphNetwork[TypeSubgraph.CYCLEGROUP][cycleGroupId].precalculatedNodesPosition){
        // get the id of nodes in group cycle
        const nodes=getNodesIDPlacedInGroupCycle(subgraphNetwork,cycleGroupId);
        // sort nodes of the group cycle by x
        if (xSort){
            nodes.sort((nodeIdA, nodeIdB) => {
                const nodeA = subgraphNetwork[TypeSubgraph.CYCLEGROUP][cycleGroupId].precalculatedNodesPosition[nodeIdA];
                const nodeB = subgraphNetwork[TypeSubgraph.CYCLEGROUP][cycleGroupId].precalculatedNodesPosition[nodeIdB];
                return nodeA.x - nodeB.x;
            });
        }
        if (parentOrChild==="parent"){
            // get parent nodes
            const parentCycles = Array.from(new Set(parentNodeNotInCycle(subgraphNetwork, nodes).flat()));
            return parentCycles;
        } else {
            // get child nodes
            const childCycles = Array.from(new Set(childNodeNotInCycle(subgraphNetwork, nodes).flat()));
            return childCycles;
        }
    }else{
        return [];
    }
}


/**
 * Returns an array of parent nodes, of a list of nodes, that are not part of any cycle in the subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param listNodes - The list of nodes to check for parent nodes.
 * @returns An array of arrays containing the parent nodes that are not part of any cycle.
 */
export function parentNodeNotInCycle(subgraphNetwork: SubgraphNetwork, listNodes: string[]): string[][] {
    const parentNodes = listNodes.map((node: string) => {
        const parentNodesI = subgraphNetwork.network.value.links
            .filter(link => link.target.id === node) // get link with those node as child
            .map(link => link.source.id) // get the other node 
            .filter(id => !inCycle(subgraphNetwork.network.value, id)) // no node in a cycle 
        return parentNodesI;
    });
    return parentNodes;
}


/**
 * Returns an array of child nodes, of a list of nodes, that are not part of any cycle in the subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param listNodes - The list of nodes to check for child nodes.
 * @returns An array of arrays containing the child nodes that are not part of any cycle.
 */
export function childNodeNotInCycle(subgraphNetwork: SubgraphNetwork, listNodes: string[]): string[][] {
    const childNodes = listNodes.map((node: string) => {
        const childNodesI = subgraphNetwork.network.value.links
            .filter(link => link.source.id === node) // get link with those node as parent
            .map(link => link.target.id) // get the other node 
            .filter(id => !inCycle(subgraphNetwork.network.value, id)) // no node in a cycle 
        return childNodesI;
    });

    return childNodes;
}




/**
 * Retrieves the IDs of nodes placed (with x and y) in a specific group cycle.
 * 
 * @param subgraphNetwork - The subgraph network containing the group cycles.
 * @param groupCycleID - The ID of the group cycle to retrieve the nodes from.
 * @returns An array of strings representing the IDs of the nodes placed in the group cycle.
 */
export function getNodesIDPlacedInGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycleID:string):string[]{
    if (groupCycleID in subgraphNetwork[TypeSubgraph.CYCLEGROUP] && subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition){
        return Object.entries(subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition)
                .filter(([_,item]) => item.x !== undefined && item.y !== undefined)
                .map(([key,_])=>key);
    }else{
        return [];
    }
}

/**
 * Retrieves the nodes (id, x, y) placed in a specific group cycle. If position is fixed it's (id, fx, fy). 
 * If there is no posisiton, it's only the id
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param groupCycleID - The ID of the group cycle.
 * @param positionAsFixed - Optional. Specifies whether to return the node positions as fixed coordinates. Defaults to false.
 * @returns An array of objects representing the nodes placed in the group cycle. Each object contains the node ID and optionally the x and y coordinates if positionAsFixed is true.
 *          If the group cycle ID is not found or the precalculated node positions are not available, null is returned.
 */
export function getNodesPlacedInGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycleID:string,positionAsFixed:boolean=false):{ id: string,x?:number, y?:number, fx?:number, fy?:number }[]{
    if (groupCycleID in subgraphNetwork[TypeSubgraph.CYCLEGROUP] && subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition){
            return Object.entries(subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition)
                    .filter(([_, item]) => { return item.x !== undefined && item.y !== undefined })
                    .map(([key, item]) => { 
                        if (item.x!==null || item.y!==null){
                            if (positionAsFixed) return { id: key,fx:item.x, fy:item.y } 
                            else return { id: key,x:item.x, y:item.y } 
                            
                        }else{
                            return { id: key }
                        }
            }); 
    }else{
        return null;
    }
}

/**
 * Retrieves the nodes (id, x, y) placed in a specific group cycle. If position is fixed it's (id, fx, fy). 
 * If there is no posisiton, it's only the id
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param groupCycleID - The ID of the group cycle.
 * @param positionAsFixed - Optional. Specifies whether to return the node positions as fixed coordinates. Defaults to false.
 * @returns An object representing the nodes placed in the group cycle. Each value contains the x and y coordinates.
 *          If the group cycle ID is not found or the precalculated node positions are not available, null is returned.
 */
export function getNodesPlacedInGroupCycleAsObject(subgraphNetwork:SubgraphNetwork,groupCycleID:string):{ [key:string]:{x:number,y:number }}{
    if (groupCycleID in subgraphNetwork[TypeSubgraph.CYCLEGROUP] && subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition){
        return Object.entries(subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycleID].precalculatedNodesPosition)
                        .filter(([_, item]) => { return item.x !== undefined && item.y !== undefined })
                        .reduce((acc, node) => { 
                            if (node[1].x!==null || node[1].y!==null){
                                 acc[node[0]]={ x:node[1].x, y:node[1].y } 
                            }
                            return acc;
                        },{});
    }else{
        return null;
    }
}



/*******************************************************************************************************************************************************/
//___________________________________________________1. Get (ordered) links__________________________________________________________________________



export function cycleMetanodeLink(link:LinkLayout, cycle:boolean=true):{inCycle:string[],tail:string,head:string}{
    
    let inCycle:string[]=[];
    let tail:string;
    let head:string;

     // source in cycleMetanode ?
    if(cycle && link.source.metadataLayout && Object.keys(link.source.metadataLayout).includes(TypeSubgraph.CYCLEGROUP) && link.source.metadataLayout[TypeSubgraph.CYCLEGROUP]){
        tail=link.source.metadataLayout[TypeSubgraph.CYCLEGROUP];  
        inCycle.push(tail);
    }else{
        tail=link.source.id;
    }

    // target in cycleMetanode ?
    if(cycle && link.target.metadataLayout && Object.keys(link.target.metadataLayout).includes(TypeSubgraph.CYCLEGROUP) && link.target.metadataLayout[TypeSubgraph.CYCLEGROUP]){
        head=link.target.metadataLayout[TypeSubgraph.CYCLEGROUP];  
        inCycle.push(head);
    }else{
        head=link.target.id;
    }
    
    if (!tail) throw new Error("tail is undefined");
    if (!head) throw new Error("head is undefined");

    const newLink={inCycle:inCycle,tail:tail,head:head};
    return newLink;
}


/**
 * Sorts the links to limit crossing with cycle metanodes (for all group cycles).
 * Links that are associated with the left node of the group cycle are placed first, followed by the links associated with the right node of the group cycle.
 * Then, all other links are added in the order of the input array.
 * 
 * @param subgraphNetwork - The subgraph network.
 * @param orderChange - A boolean indicating whether to change the order with group cycle. Default is false.
 * @returns The subgraphNetwork and an array of sorted links.
 */
export function sortLinksWithAllGroupCycle(subgraphNetwork:SubgraphNetwork,orderChange:boolean=false):{subgraphNetwork:SubgraphNetwork,linksOrdered:LinkLayout[]}{
    let links:Link[]=[];

    // change ordre with group cycle
    if (orderChange  && subgraphNetwork[TypeSubgraph.CYCLEGROUP]){
        
        // adding edge in right order for each group cycle
        Object.keys(subgraphNetwork[TypeSubgraph.CYCLEGROUP]).forEach((groupCycle) => {
            const resultSorting=sortLinksWithGroupCycle(subgraphNetwork,groupCycle);
            subgraphNetwork=resultSorting.subgraphNetwork;
            links=links.concat(resultSorting.linksOrdered);
        });
        // add other links
        Object.values(subgraphNetwork.network.value.links).forEach((link) => {
            if (!links.includes(link)){
                links.push(link);
            }
        });
        return { subgraphNetwork:subgraphNetwork,linksOrdered:links };
    
    }else{ // no change
        return { subgraphNetwork:subgraphNetwork,linksOrdered:subgraphNetwork.network.value.links };
    }
}

/**
 * Sorts the links based on the given group cycle.
 * Links that are associated with the left node of the group cycle are placed first, followed by the links associated with the right node of the group cycle.
 * Choose if ordering apply for parent or children of cycle (the one with the most links)
 * 
 * @param subgraphNetwork - The subgraph network containing the cycles group.
 * @param groupCycle - The group cycle id to sort the links.
 * @returns The subgraphNetwork and an array of sorted links.
 */
function sortLinksWithGroupCycle(subgraphNetwork:SubgraphNetwork,groupCycle:string):{subgraphNetwork:SubgraphNetwork,linksOrdered:LinkLayout[]}{
    let links:LinkLayout[]=[];
    if( groupCycle in subgraphNetwork.cyclesGroup){
        // sort parent of cycle by x of the child in the cycle
        // (first : parent of the left node of group cycle)
        const parents=neighborsGroupCycle(subgraphNetwork,groupCycle,"parent",true);
        const children=neighborsGroupCycle(subgraphNetwork,groupCycle,"child",true);

        let nodeOrder:string[]=[];
        let source:"node"|"groupCycle";

        // if more parent than children : order parent
        if (parents.length>=children.length){
            nodeOrder=parents;
            source="node";
            subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycle].ordering=Ordering.IN;
        }else{
            // order children
            nodeOrder=children;
            source="groupCycle";
            subgraphNetwork[TypeSubgraph.CYCLEGROUP][groupCycle].ordering=Ordering.OUT;
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
        return { subgraphNetwork:subgraphNetwork,linksOrdered:links };
    }else{
        return { subgraphNetwork:subgraphNetwork,linksOrdered:[] };
    }
}

/**
 * Finds the links that are associated with the given node and group cycle.
 * For parent nodes, the source is the node (and the target is the group cycle). 
 * For child nodes, the source is the group cycle (and the target is the node).
 * 
 * @param subgraphNetwork 
 * @param nodeId node id
 * @param groupCycleId id of cycle group
 * @param source "node" if the parent links are needed, "groupCycle" if the child links are needed
 * @returns links that are child or parent of a group cycle
 */
function getLinksNodeGroupCycle(subgraphNetwork:SubgraphNetwork,nodeId:string,groupCycleId:string,source:"node"|"groupCycle"):LinkLayout[]{
    if (source==="node"){
        // node to group cycle
        return Object.values(subgraphNetwork.network.value.links).filter((link) => {
            return link.source.id === nodeId && link.target.metadataLayout && TypeSubgraph.CYCLEGROUP in link.target.metadataLayout && link.target.metadataLayout[TypeSubgraph.CYCLEGROUP] === groupCycleId;
        });
    }else{
        // group cycle to node
        return Object.values(subgraphNetwork.network.value.links).filter((link) => {
            return link.target.id === nodeId && link.source.metadataLayout && TypeSubgraph.CYCLEGROUP in link.source.metadataLayout && link.source.metadataLayout[TypeSubgraph.CYCLEGROUP] === groupCycleId;
        });
    }
    
}

/**
 * Retrieves the links between nodes based on a list of node IDs.
 * 
 * @param network - The network layout object.
 * @param nodes - An array of node IDs.
 * @returns An array of link objects containing the source and target IDs.
 */
export function getLinksForListNodes(network: NetworkLayout, nodes: string[]): {source:string,target:string}[] {
    return network.links.filter(link => 
        nodes.includes(link.source.id) && nodes.includes(link.target.id)
    ).map(link => { return { source: link.source.id, target: link.target.id } });
}


/*******************************************************************************************************************************************************/
//___________________________________________________2. Get graph __________________________________________________________________________




/**
 * Retrieves the list of node and links for a specific cycle group.
 * Position of nodes can be fixed.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param groupCycleName - The name of the cycle group.
 * @param positionAsFixed - (Optional) Indicates whether the node positions should be fixed. Default is false.
 * 
 * @returns An object containing the list of nodes and links for the cycle group.
 */
export function getListNodeLinksForCycleGroup(subgraphNetwork:SubgraphNetwork,groupCycleName:string,positionAsFixed:boolean=false)
:{nodes:{ id: string,fx?:number, fy?:number,x?:number,y?:number }[],links:{source:string,target:string}[]}{
    const nodesGroupCycle=getNodesPlacedInGroupCycle(subgraphNetwork,groupCycleName,positionAsFixed);
    const nodesGroupCycleName=Object.values(nodesGroupCycle).map(node=>node.id);
    const linksGroupCycle=getLinksForListNodes(subgraphNetwork.network.value,nodesGroupCycleName);
    return {nodes:nodesGroupCycle,links:linksGroupCycle};
}

/**
 * Retrieves an object for node and  a list for links for a specific cycle group.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param groupCycleName - The name of the cycle group.
 * 
 * @returns An object containing the list of nodes and links for the cycle group.
 */
export function getListNodeLinksForCycleGroupAsObject(subgraphNetwork:SubgraphNetwork,groupCycleName:string)
:{nodes:{[key:string]:{ x:number,y:number }},links:{source:string,target:string}[]}{
    const nodesGroupCycle=getNodesPlacedInGroupCycleAsObject(subgraphNetwork,groupCycleName);
    const nodesGroupCycleName=Object.keys(nodesGroupCycle);
    const linksGroupCycle=getLinksForListNodes(subgraphNetwork.network.value,nodesGroupCycleName);
    return {nodes:nodesGroupCycle,links:linksGroupCycle};
}


/*******************************************************************************************************************************************************/
//___________________________________________________3. Get relation cycle __________________________________________________________________________



/**
 * Return the name of the parent cycle of the cycle, if not, return the name of the cycle
 * @param cycleName 
 * @param subgraphNetwork 
 * @returns the name of the parent cycle of the cycle, if not, return the name of the cycle
 */
export function parentCycle(cycleName:string,subgraphNetwork:SubgraphNetwork):string{
    if (subgraphNetwork[TypeSubgraph.CYCLE][cycleName].parentSubgraph && subgraphNetwork[TypeSubgraph.CYCLE][cycleName].parentSubgraph.type==TypeSubgraph.CYCLE){
            return subgraphNetwork[TypeSubgraph.CYCLE][cycleName].parentSubgraph.name;
    }else{ 
        return cycleName;
    }
}




// function getLinkParent2GroupCycle(subgraphNetwork:SubgraphNetwork,parentId:string,groupCycle:string){
//     return Object.values(subgraphNetwork.network.value.links).filter((link) => {
//         return link.source.id === parentId && link.target.metadata && TypeSubgraph.CYCLEGROUP in link.target.metadata && link.target.metadata[TypeSubgraph.CYCLEGROUP] === groupCycle;
//     });
// }

// function listOfCycles(cycleList:string[],subgraphNetwork:SubgraphNetwork):string[]{
//     const newCyclesList=[];
//     cycleList.forEach(cycle=>{
//         // if cycle is a 'child' of another cycle : no new metanode, it is considered as the parent cycle metanode (else it is the cycle)
//         const biggerCycle=inBiggerCycle(cycle,subgraphNetwork); 
//         if (!newCyclesList.includes(biggerCycle)){
//             newCyclesList.push(biggerCycle);
//         }
//     });
//     return newCyclesList;
// }
