import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { getContentFromURL } from "./importNetwork";
import { removeAllSelectedNodes , duplicateAllNodesByAttribut} from "@metabohub/viz-core";
import { S } from "vitest/dist/reporters-1evA5lom";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { MetaboliteType, Reaction, ReactionInterval } from "@/types/Reaction";

//-----------------------------------------------------------------------------------------------------------------------------------
//___________________________________________________Remove side compounds____________________________________________________


export async function putDuplicatedSideCompoundAside(subgraphNetwork:SubgraphNetwork, pathListSideCompounds:string):Promise<SubgraphNetwork>{

    return new Promise(async (resolve, reject) => {
        try {
            // finding side compounds in network
            await addSideCompoundAttributeFromList(subgraphNetwork,pathListSideCompounds);
            // duplication of side compounds
            duplicateSideCompound(subgraphNetwork);
            // remove side compounds from network, they are keeped aside in subgraphNetwork.sideCompounds
            subgraphNetwork=removeSideCompoundsFromNetwork(subgraphNetwork);
            resolve(subgraphNetwork);
        } catch (error) {
            reject(error);
        }
    });

}

async function sideCompoundsInNetworkFromFile(subgraphNetwork:SubgraphNetwork,pathListSideCompounds:string):Promise<string[]>{
    const listIDSideCompounds = await getIDSideCompoundsFromFile(pathListSideCompounds);
    const network = subgraphNetwork.network.value;
    return Object.keys(network.nodes).filter(id => listIDSideCompounds.includes(id));
}

async function getIDSideCompoundsFromFile(pathListSideCompounds:string):Promise<string[]>{
    const sideCompoundsFile=pathListSideCompounds;
    const sideCompoundsString = await getContentFromURL(sideCompoundsFile);
    const lines = sideCompoundsString.split('\n');
    const listId: Array<string> = [];
    lines.forEach((line: string) => {
      listId.push(line.split('\t')[0]);
    })
    return listId;
}

async function addSideCompoundAttributeFromList(subgraphNetwork:SubgraphNetwork, pathListSideCompounds):Promise<void>{
    const listIDSideCompounds = await sideCompoundsInNetworkFromFile(subgraphNetwork,pathListSideCompounds);
    listIDSideCompounds.forEach((sideCompoundID) => {
        addSideCompoundAttribute(subgraphNetwork,sideCompoundID);
    });
}

function addSideCompoundAttribute(subgraphNetwork:SubgraphNetwork,sideCompoundID:string):void{
    const network = subgraphNetwork.network.value;
    // add attribute isSideCompound to the node
    if(!network.nodes[sideCompoundID].metadata) network.nodes[sideCompoundID].metadata={};
    network.nodes[sideCompoundID].metadata["isSideCompound"]=true;
    // add sideCompound to classes
    if(!network.nodes[sideCompoundID].classes) network.nodes[sideCompoundID].classes=[];
    network.nodes[sideCompoundID].classes.push("sideCompound");
}

function isSideCompound(network:Network,nodeID:string):boolean{
    return Boolean(network.nodes[nodeID].metadata && network.nodes[nodeID].metadata.isSideCompound);
}

function isDuplicate(network:Network,nodeID:string):boolean{
    return Boolean(network.nodes[nodeID].classes && network.nodes[nodeID].classes.includes("duplicate"));
}

function duplicateSideCompound(subgraphNetwork:SubgraphNetwork):void{
    const network = subgraphNetwork.network.value;
    const networkStyle = subgraphNetwork.networkStyle.value;
    // duplication of cofactors
    duplicateAllNodesByAttribut(network, networkStyle, "isSideCompound");
    // add attributes to side compounds duplicates
    sideCompoundAttributeOnDuplicate(subgraphNetwork);
}

function sideCompoundAttributeOnDuplicate(subgraphNetwork:SubgraphNetwork):void{
    const network = subgraphNetwork.network.value;
    Object.keys(network.nodes).forEach((nodeID)=>{
        if(isDuplicate(network,nodeID)){
            addSideCompoundAttribute(subgraphNetwork,nodeID);
        }
    });
}

function removeSideCompoundsFromNetwork(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{

    const network = subgraphNetwork.network.value;
    subgraphNetwork.sideCompounds={};
    const listIDCoftactors:string[]=[];

    // for each link, see if the source or target is in the list of side compounds : add information in subgraphNetwork.sideCompounds
    network.links.forEach((link) => {
        // if source is side compound
        if (isSideCompound(network,link.source.id)) {
            if(!(link.target.id in subgraphNetwork.sideCompounds)){
                subgraphNetwork.sideCompounds[link.target.id]={reactants:[],products:[]};
            }
            subgraphNetwork.sideCompounds[link.target.id].reactants.push(link.source);
            listIDCoftactors.push(link.source.id);
        }
        // if target is side compound
        if (isSideCompound(network,link.target.id)) {
            if(!(link.source.id in subgraphNetwork.sideCompounds)){
                subgraphNetwork.sideCompounds[link.source.id]={reactants:[],products:[]};
            }
            subgraphNetwork.sideCompounds[link.source.id].products.push(link.target);
            listIDCoftactors.push(link.target.id);
        }
    });

    // remove side compounds from network
    removeAllSelectedNodes(listIDCoftactors,network);

    return subgraphNetwork;
}

//-----------------------------------------------------------------------------------------------------------------------------------
//___________________________________________________Reinsert side compounds____________________________________________________


export function reinsertionSideCompounds(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    if(subgraphNetwork.sideCompounds){
        const network = subgraphNetwork.network.value;
        // update side compounds for reversed reactions
        subgraphNetwork=updateSideCompoundsReversibleReaction(subgraphNetwork);
        // for each reaction, apply motif stamp
        Object.keys(subgraphNetwork.sideCompounds).forEach((reactionID)=>{
            subgraphNetwork=motifStampSideCompound(subgraphNetwork,reactionID);
        });       
    }
    return subgraphNetwork;

}

function motifStampSideCompound(subgraphNetwork:SubgraphNetwork,reactionID:string):SubgraphNetwork{
    // initialize reaction stamp
    const reaction=initializeReactionSideCompounds(subgraphNetwork,reactionID);
    // find intervals between reactants and products
    reaction.sideCompoundIntervals=findCofactorIntervals(reaction);
    // find the biggest interval
    const biggest=biggestInterval(reaction);
    reaction.sideCompoundIntervals=[biggest.interval];
    // find spacing between side compounds
    const spacing=findSpacingSideCompounds(reaction,biggest.size);
    reaction.angleSpacingReactant=spacing.reactant;
    reaction.angleSpacingProduct=spacing.product;
    // give coordinates to all side compounds
    subgraphNetwork=giveCoordAllSideCompounds(subgraphNetwork,reaction);
    // insert side compounds in network
    insertAllSideCompoundsInNetwork(subgraphNetwork,reaction);
    return subgraphNetwork;
}


function updateSideCompoundsReversibleReaction(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    Object.keys(subgraphNetwork.sideCompounds).forEach((reactionID)=>{
        // if reaction has been reversed : exchange products and reactants
        if(reactionID in network.nodes && "classes" in network.nodes[reactionID] && network.nodes[reactionID].classes.includes("reversibleVersion")){
            const products=subgraphNetwork.sideCompounds[reactionID].products;
            const reactants=subgraphNetwork.sideCompounds[reactionID].reactants;
            subgraphNetwork.sideCompounds[reactionID].products=reactants;
            subgraphNetwork.sideCompounds[reactionID].reactants=products;
        }
    });
    return subgraphNetwork;
}

function initializeReactionSideCompounds(subgraphNetwork:SubgraphNetwork,idReaction:string):Reaction{
    const network = subgraphNetwork.network.value;
    if (network.nodes[idReaction] && subgraphNetwork.sideCompounds && subgraphNetwork.sideCompounds[idReaction]){
        // position of reaction
        const x=network.nodes[idReaction].x;
        const y=network.nodes[idReaction].y;
        // reactant side compounds
        const reactantSideCompounds=subgraphNetwork.sideCompounds[idReaction].reactants.map((node)=>node.id);
        // product side compounds
        const productSideCompounds=subgraphNetwork.sideCompounds[idReaction].products.map((node)=>node.id);
        // angle metabolites (but side compounds) associated with the reaction
        const angleMetabolites:{[key:string]:{angle:number,type:MetaboliteType}}={};
        const metabolitesReaction=getMetaboliteFromReaction(subgraphNetwork,idReaction);
        metabolitesReaction.forEach((metabolite)=>{
            const xMetabolite=network.nodes[metabolite.id].x;
            const yMetabolite=network.nodes[metabolite.id].y;
            const angle=angleRadianSegment(x,y,xMetabolite,yMetabolite);
            angleMetabolites[metabolite.id]={angle:angle,type:metabolite.type};
        });
        return {
            id:idReaction,
            reactantSideCompounds:reactantSideCompounds,
            productSideCompounds:productSideCompounds,
            angleMetabolites:angleMetabolites
        };
    }else{
        return null;
    }
}

function getMetaboliteFromReaction(subgraphNetwork: SubgraphNetwork, idReaction: string): { id: string; type: MetaboliteType }[] {
    const network = subgraphNetwork.network.value;
    return network.links
        .filter((link) => link.source.id === idReaction || link.target.id === idReaction)
        .map((link) => ({
            id: link.source.id === idReaction ? link.target.id : link.source.id,
            type: link.source.id === idReaction ? MetaboliteType.PRODUCT : MetaboliteType.REACTANT,
        }));
}

function angleRadianSegment(x1:number,y1:number,x2:number,y2:number,anticlockwise:boolean=true):number{
    // angle in the anti-clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    if (anticlockwise) {return  2*Math.PI-(Math.atan2(y2-y1,x2-x1)+2*Math.PI)%(2*Math.PI);}
    // angle in the clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    else{return (Math.atan2(y2-y1,x2-x1)+2*Math.PI)%(2*Math.PI);}
}

function findCofactorIntervals(reaction: Reaction): ReactionInterval[] {
    let intervals: ReactionInterval[] = [];
    // sort metabolites by angle
    const sortedMetabolites = Object.entries(reaction.angleMetabolites)
        .map(([id, {angle, type}]) => ({id, angle, type}))
        .sort((a, b) => a.angle - b.angle);

    // initialisation
    const lastIndex=sortedMetabolites.length-1;
    let previousType = sortedMetabolites[lastIndex]?.type;
    let previousId = sortedMetabolites[lastIndex]?.id;
    let firstInterval=false;

    // Process sorted metabolites to find intervals between reactants and products
    sortedMetabolites.forEach((currentMetabolite, i) => {
        if (currentMetabolite.type !== previousType) {
            // is it the interval between the last and the first metabolite ? (special case for calculations)
            if (i === 0) {
                firstInterval=true;
            }else{
                firstInterval=false;
            }
            // Change of type, we have a new interval
            const interval= createInterval(reaction,previousId,previousType,currentMetabolite.id,currentMetabolite.type,firstInterval);
            intervals.push(interval);
        }
        // Update previous values
        previousType = currentMetabolite.type;
        previousId = currentMetabolite.id;
    });

    return intervals;
}

function createInterval(reaction:Reaction,id1:string,type1:MetaboliteType,id2:string,type2:MetaboliteType,firstInterval:boolean=false):ReactionInterval{
    let typeInterval:number;
    const angles=reaction.angleMetabolites;
    const reactant= type1 === MetaboliteType.REACTANT ? id1 : id2;
    const product= type2 === MetaboliteType.PRODUCT ? id2 : id1; 

    if (angles[reactant].angle<angles[product].angle){
        // 0 if not special case , else 2
        typeInterval=0+2*Number(firstInterval);
    }else{
        // 1 if not special case , else 3
        typeInterval=1+2*Number(firstInterval);
    }

    return{
        typeInterval: typeInterval, 
        reactant: reactant,
        product: product,
    }
}


function biggestInterval(reaction: Reaction): {interval:ReactionInterval,size:number} {
    const intervals = reaction.sideCompoundIntervals;
    if (intervals.length === 0) {
        throw new Error("Empty intervals");
    }
    // size of intervals
    const sizes = intervals.map((_, index) => sizeInterval(reaction, index));
    // find biggest size
    const maxValue = Math.max(...sizes);
    // Return interval associated
    const maxIndex = sizes.indexOf(maxValue);
    return {interval:intervals[maxIndex],size:maxValue};
}


function sizeInterval(reaction:Reaction,intervalIndex:number):number{
    const angles=reaction.angleMetabolites;
    const interval=reaction.sideCompoundIntervals[intervalIndex];
    if (interval.typeInterval===0 || interval.typeInterval===1){
        // |angle1-angle2|
        return Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }else{
        // special case where we want the complementary angle
        return 2*Math.PI-Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }
}


function findSpacingSideCompounds(reaction:Reaction,sizeInterval):{reactant:number,product:number}{
    const reactantNumber=reaction.reactantSideCompounds.length;
    const productNumber=reaction.productSideCompounds.length;
    return {
        reactant: reactantNumber === 0 ? undefined : sizeInterval / (2 * (reactantNumber+1)),
        product: productNumber === 0 ? undefined : sizeInterval / (2 * (productNumber+1))
    };
}

function giveCoordAllSideCompounds(subgraphNetwork:SubgraphNetwork,reaction:Reaction):SubgraphNetwork{
    if (reaction.id === "r_17"){
        console.log(reaction);
    }
    const distance=100; /// TO CHANGE
    const sideCompounds=subgraphNetwork.sideCompounds[reaction.id];
    const reactionCoord=subgraphNetwork.network.value.nodes[reaction.id];
    // Reactants Placement
    const startReactant= reaction.sideCompoundIntervals[0].reactant;
    let startAngle=reaction.angleMetabolites[startReactant].angle;
    sideCompounds.reactants.forEach((sideCompoundNode,i)=>{
        let direction:number;
        const typeInterval=reaction.sideCompoundIntervals[0].typeInterval;
        if (typeInterval===0 || typeInterval===3){
            direction=-1; // go left
        } else if (typeInterval===1 || typeInterval===2){
            direction=1; // go right
        }
        const angle:number=startAngle;//+ direction * i*reaction.angleSpacingReactant;
        sideCompoundNode=giveCoordSideCompound(sideCompoundNode,angle,reactionCoord,distance);
    });
    // Products Placement
    const startProduct= reaction.sideCompoundIntervals[0].product;
    startAngle=reaction.angleMetabolites[startProduct].angle;
    sideCompounds.products.forEach((sideCompoundNode,i)=>{
        let direction:number;
        const typeInterval=reaction.sideCompoundIntervals[0].typeInterval;
        if (typeInterval===0 || typeInterval===3){
            direction=1; // go right
        } else if (typeInterval===1 || typeInterval===2){
            direction=-1; // go left
        }
        const angle:number=startAngle;//+ direction * i*reaction.angleSpacingProduct;
        if (reaction.id === "r_17"){
            console.log(angle);
        }
        sideCompoundNode=giveCoordSideCompound(sideCompoundNode,angle,reactionCoord,distance);
        
    });
   
    return subgraphNetwork;
}



function giveCoordSideCompound(sideCompound:Node,angle:number,center:{x:number,y:number},distance:number):Node{
    sideCompound.x = center.x + distance * Math.cos(angle);
    sideCompound.y = center.y + distance * Math.sin(angle);
    return sideCompound;
}

function insertAllSideCompoundsInNetwork(subgraphNetwork:SubgraphNetwork,reaction:Reaction):void{
    const network = subgraphNetwork.network.value;
    const sideCompounds=subgraphNetwork.sideCompounds[reaction.id];
    // Reactants
    Object.keys(reaction.reactantSideCompounds).forEach((reactant)=>{
        insertSideCompoundInNetwork(subgraphNetwork,reaction.id,sideCompounds.reactants[reactant],MetaboliteType.REACTANT);
    });
    // Products
    Object.keys(reaction.productSideCompounds).forEach((product)=>{
        insertSideCompoundInNetwork(subgraphNetwork,reaction.id,sideCompounds.products[product],MetaboliteType.PRODUCT);
    });
}

function insertSideCompoundInNetwork(subgraphNetwork:SubgraphNetwork,reactionID:string,sideCompound:Node,typeSideCompound:MetaboliteType):void{
    const network = subgraphNetwork.network.value;
    // insert node
    network.nodes[sideCompound.id]=sideCompound;
    // insert link
    if (typeSideCompound===MetaboliteType.REACTANT){
        const idLink=sideCompound.id+"--"+reactionID;
        network.links.push({id:idLink,source:network.nodes[sideCompound.id],target:network.nodes[reactionID]});
    }else{
        const idLink=reactionID+"--"+sideCompound.id;
        network.links.push({id:idLink,source:network.nodes[reactionID],target:network.nodes[sideCompound.id]});
    }
}



