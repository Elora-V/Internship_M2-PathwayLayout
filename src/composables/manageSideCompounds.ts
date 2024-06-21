import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { getContentFromURL } from "./importNetwork";
import { removeAllSelectedNodes , duplicateAllNodesByAttribut} from "@metabohub/viz-core";
import { S } from "vitest/dist/reporters-1evA5lom";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { MetaboliteType, Reaction } from "@/types/Reaction";

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
            motifStampSideCompound(subgraphNetwork,reactionID);
        });       
    }
    return subgraphNetwork;

}

function motifStampSideCompound(subgraphNetwork:SubgraphNetwork,reactionID:string):void{
    const reaction=initializeReactionSideCompounds(subgraphNetwork,reactionID);
    console.log(reaction);
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
            type: link.source.id === idReaction ? MetaboliteType.PRODUCT : MetaboliteType.REACTIF,
        }));
}

function angleRadianSegment(x1:number,y1:number,x2:number,y2:number,anticlockwise:boolean=true):number{
    // angle in the anti-clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    if (anticlockwise) {return  2*Math.PI-(Math.atan2(y2-y1,x2-x1)+2*Math.PI)%(2*Math.PI);}
    // angle in the clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    else{return (Math.atan2(y2-y1,x2-x1)+2*Math.PI)%(2*Math.PI);}
}

function bissectriceAngle(angle1:number,angle2:number,addAngle:number=0):number{
    return ((angle1+angle2)/2 + addAngle+2*Math.PI)%(2*Math.PI);
}




