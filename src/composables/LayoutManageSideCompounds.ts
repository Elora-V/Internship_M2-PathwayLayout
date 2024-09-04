// Type imports
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { MetaboliteType, Reaction, ReactionInterval } from "@/types/Reaction";
import { VizArgs } from "@/types/EnumArgs";

// Composable imports
import { getContentFromURL } from "./importNetwork";
import { removeAllSelectedNodes , duplicateAllNodesByAttribut} from "@metabohub/viz-core";
import { getMeanNodesSizePixel, inchesToPixels, minEdgeLength as minEdgeLength, pixelsToInches } from "./CalculateSize";
import { getAttributSideCompounds, isDuplicate, isSideCompound, setAsSideCompound } from "./GetSetAttributsNodes";

// General imports
import { S } from "vitest/dist/reporters-1evA5lom";
import { c } from "vite/dist/node/types.d-aGj9QkWt";



/*******************************************************************************************************************************************************
 * 
 * This file contains the functions to manage side compounds.
 * 
 * *********************************
 * 
 * 0. Declare side compounds
 * 
 * -> addSideCompoundAttributeFromList :
 *       add attribute of side compound to all nodes in network from a list
 * 
 * -> getIDSideCompoundsInNetworkFromFile :
 *      return the list of id of side compounds in the network
 * 
 * -> getIDSideCompoundsFromFile :
 *      return the list of id of side compounds from a file
 * 
 * 
 **********************************
 * 
 * 
 * 1. Duplicate and remove side compounds
 * 
 * 
 * -> putDuplicatedSideCompoundAside :
 *      duplicate and put aside side compounds in the network
 * 
 * -> duplicateSideCompound :
 *       duplicate the side compounds in the given subgraph network
 * 
 * -> sideCompoundAttributeOnDuplicate :
 *       adds side compound attribute to nodes in the network that are duplicates
 * 
 * -> removeSideCompoundsFromNetwork :
 *       removes side compounds from the network, and put them aside in sideCompounds
 * 
 * 
 * *********************************
 * 
 * 
 * 2. Reinsert side compounds
 * 
 *      
 * *******************************************************************************************************************************************************/





/*******************************************************************************************************************************************************/
//___________________________________________________0.  Declare side compounds__________________________________________________________________________




/**
 * Add attribute of side compound to all nodes in network from a list 
 * @param network 
 * @param pathListSideCompounds path to the list of id of side compounds
 */
export async function addSideCompoundAttributeFromList(subgraphNetwork:SubgraphNetwork, pathListSideCompounds):Promise<void>{
    const listIDSideCompounds = await getIDSideCompoundsInNetworkFromFile(subgraphNetwork,pathListSideCompounds);
    listIDSideCompounds.forEach((sideCompoundID) => {
        setAsSideCompound(subgraphNetwork.network.value,sideCompoundID);
    });
}

/**
 * Return the list of id of side compounds in the network
 * @param subgraphNetwork 
 * @param pathListSideCompounds path to the list of id of side compounds
 * @returns list of id of side compounds in the network
 */
async function getIDSideCompoundsInNetworkFromFile(subgraphNetwork:SubgraphNetwork,pathListSideCompounds:string):Promise<string[]>{
    let listIDSideCompounds:string[]=[];
    const network = subgraphNetwork.network.value;
    try {
        listIDSideCompounds = await getIDSideCompoundsFromFile(pathListSideCompounds);
    } catch (error) {
        console.error(error);
    }
    return Object.keys(network.nodes).filter(id => listIDSideCompounds.includes(id));
}

/**
 * Return the list of id of side compounds from a file
 * @param pathListSideCompounds path to the list of id of side compounds
 * @returns list of id of side compounds
 */
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


/*******************************************************************************************************************************************************/
//___________________________________________________1.  Duplicate and remove side compounds__________________________________________________________________________



/**
 * Duplicate and put aside side compounds in the network
 * @param subgraphNetwork contains network with sideCompounds
 * @param doDuplicateSideCompounds do duplication ?
 * @param doPutAsideSideCompounds  put aside ?
 * @param addSideCompoundAttribute  add attribut of side compound with a list?
 * @param pathListSideCompounds path to the list of id of side compounds
 * @returns subgraphNetwork with updated network and sideCompounds
 */
export async function putDuplicatedSideCompoundAside(subgraphNetwork:SubgraphNetwork, doDuplicateSideCompounds:boolean,doPutAsideSideCompounds:boolean, addSideCompoundAttribute:boolean=true, pathListSideCompounds:string):Promise<SubgraphNetwork>{

    return new Promise(async (resolve, reject) => {
        try {
            // finding side compounds in network
            if (addSideCompoundAttribute){
                await addSideCompoundAttributeFromList(subgraphNetwork,pathListSideCompounds);
            }
            // duplication of side compounds
            if (doDuplicateSideCompounds){
                duplicateSideCompound(subgraphNetwork);
            }
            // remove side compounds from network, they are keeped aside in subgraphNetwork.sideCompounds
            if (doPutAsideSideCompounds){
            subgraphNetwork=removeSideCompoundsFromNetwork(subgraphNetwork);
            }
            resolve(subgraphNetwork);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}



/**
 * Duplicates the side compounds in the given subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network containing the side compounds to be duplicated.
 * @returns void
 */
export function duplicateSideCompound(subgraphNetwork:SubgraphNetwork):void{
    const network = subgraphNetwork.network.value;
    const networkStyle = subgraphNetwork.networkStyle.value;
    // duplication of side compounds
    duplicateAllNodesByAttribut(network, networkStyle, getAttributSideCompounds());
    // add attributes to side compounds duplicates
    sideCompoundAttributeOnDuplicate(subgraphNetwork);
}

/**
 * Adds side compound attribute to nodes in the network that are duplicates.
 * 
 * @param subgraphNetwork - The subgraph network containing the nodes.
 * @returns void
 */
function sideCompoundAttributeOnDuplicate(subgraphNetwork:SubgraphNetwork):void{
    const network = subgraphNetwork.network.value;
    Object.keys(network.nodes).forEach((nodeID)=>{
        if(isDuplicate(network,nodeID)){
            setAsSideCompound(subgraphNetwork.network.value,nodeID);
        }
    });
}



/**
 * Removes side compounds from the network, and put them aside in sideCompounds.
 * 
 * @param subgraphNetwork - The subgraph network from which side compounds will be removed.
 * @returns The updated subgraph network with side compounds removed.
 */
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

/*******************************************************************************************************************************************************/
//___________________________________________________2.  Reinsert side compounds__________________________________________________________________________


/**
 * Reinsert side compounds in the network
 * @param subgraphNetwork 
 * @param factorMinEdgeLength factor of the minimal length of edge to calculate side compounds edge length
 * @param doReactionReversible do reaction reversible ?
 * @returns subgraphNetwork with updated network and sideCompounds
 */
export function reinsertionSideCompounds(subgraphNetwork:SubgraphNetwork,factorMinEdgeLength:number=1/2,doReactionReversible:boolean):SubgraphNetwork{
    if(subgraphNetwork.sideCompounds){
        const network = subgraphNetwork.network.value;
        const networkStyle = subgraphNetwork.networkStyle.value;

        // get minimal length of edge to calculate side compounds edge length
        if (!subgraphNetwork.stats) subgraphNetwork.stats={};
            // get the default value : min lenght if there is no link in the network (when side compounds are removed) :
        const meanSize=getMeanNodesSizePixel(Object.values(network.nodes),networkStyle, false);
        const defaultSep=(meanSize.height+meanSize.width)/2;
        const rankSep=subgraphNetwork.attributs[VizArgs.RANKSEP]?inchesToPixels(subgraphNetwork.attributs[VizArgs.RANKSEP] as number):defaultSep;
        const nodeSep=subgraphNetwork.attributs[VizArgs.NODESEP]?inchesToPixels(subgraphNetwork.attributs[VizArgs.NODESEP] as number):defaultSep;
        //const invFactor=factorMinEdgeLength===0?1:1/factorMinEdgeLength;
        const minEdgeLengthDefault=(nodeSep+rankSep)/2*factorMinEdgeLength; 
            // get the min length of edge in the network (if not, use default value)
        const minLength=minEdgeLength(subgraphNetwork.network.value,false,minEdgeLengthDefault);
        subgraphNetwork.stats.minEdgeLengthPixel=minLength;

        // update side compounds for reversed reactions
        if (doReactionReversible){
            subgraphNetwork=updateSideCompoundsReversibleReaction(subgraphNetwork);
        }

        // for each reaction, apply motif stamp
        Object.keys(subgraphNetwork.sideCompounds).forEach((reactionID)=>{
            subgraphNetwork=motifStampSideCompound(subgraphNetwork,reactionID,factorMinEdgeLength);
        });       
    }
    return subgraphNetwork;

}

// MODIFICATION !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function updateSideCompoundsReversibleReaction(subgraphNetwork:SubgraphNetwork):SubgraphNetwork{
    const network = subgraphNetwork.network.value;
    console.warn('modifier updateSideCompoundsReversibleReaction avec nouveau attribut');
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


/**
 * Applies a motif stamp to place side compound for a reaction.
 * 
 * @param subgraphNetwork
 * @param reactionID - The ID of the reaction.
 * @param factorMinEdgeLength - The factor length for the side compounds. Default value is 1/2.
 * @returns The subgraphNetwork with the motif stamp applied for the reaction.
 */
function motifStampSideCompound(subgraphNetwork:SubgraphNetwork,reactionID:string,factorMinEdgeLength:number=1/2):SubgraphNetwork{
    try {
        // initialize reaction stamp
        let reaction=initializeReactionSideCompounds(subgraphNetwork,reactionID);
        // find intervals between reactants and products
        reaction.intervalsAvailables=findCofactorIntervals(reaction);
        // find the biggest interval
        const biggest=biggestInterval(reaction);
        reaction.intervalsAvailables=[biggest.interval];
        // find spacing between side compounds
        const spacing=findSpacingSideCompounds(reaction,biggest.size);
        reaction.angleSpacingReactant=spacing.reactant;
        reaction.angleSpacingProduct=spacing.product;
        // give coordinates to all side compounds
        subgraphNetwork=giveCoordAllSideCompounds(subgraphNetwork,reaction,factorMinEdgeLength);
        // insert side compounds in network
        insertAllSideCompoundsInNetwork(subgraphNetwork,reaction);
    } catch (error) {
        console.error("Error in motifStampSideCompound for reaction "+reactionID);
        console.error(error);
    }
    return subgraphNetwork;
}


/**
 * Initializes a reaction for side compounds motif
 * 
 * @param subgraphNetwork - The subgraph network containing the reaction and side compounds.
 * @param idReaction - The ID of the reaction.
 * @returns The initialized Reaction object with side compounds and metabolite angles.
 * @throws Error if the reaction is not found in the network.
 */
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
            sideCompoundsReactants:reactantSideCompounds,
            sideCompoundsProducts:productSideCompounds,
            metabolitesAngles:angleMetabolites,
        };
    }else if (!network.nodes[idReaction]){
        throw new Error("Reaction not found");
    }
}

/**
 * Retrieves the metabolites associated with a given reaction in a subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network containing the reaction and metabolites.
 * @param idReaction - The ID of the reaction.
 * @returns An array of objects representing the metabolites, each containing an ID and a type.
 */
function getMetaboliteFromReaction(subgraphNetwork: SubgraphNetwork, idReaction: string): { id: string; type: MetaboliteType }[] {
    const network = subgraphNetwork.network.value;
    return network.links
        .filter((link) => link.source.id === idReaction || link.target.id === idReaction)
        .map((link) => ({
            id: link.source.id === idReaction ? link.target.id : link.source.id,
            type: link.source.id === idReaction ? MetaboliteType.PRODUCT : MetaboliteType.REACTANT,
        }));
}

/**
 * Calculates the angle in radians between two points.
 * 
 * @param x1 The x-coordinate of the first point.
 * @param y1 The y-coordinate of the first point.
 * @param x2 The x-coordinate of the second point.
 * @param y2 The y-coordinate of the second point.
 * @param clockwise Determines whether the angle should be calculated in the clockwise direction. Default is true.
 * @returns The angle in radians between the two points.
 */
function angleRadianSegment(x1:number,y1:number,x2:number,y2:number,clockwise:boolean=true):number{
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
        console.error("Invalid coordinates for angle : one or more coordinates are not finite numbers.");
        return NaN; 
    }

    const angle = Math.atan2(y2 - y1, x2 - x1);
    if (isNaN(angle)) {
        console.error("Calculation angle resulted in NaN.");
        return NaN;
    }

    // angle in the anti-clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    if (!clockwise) {
        return 2 * Math.PI - (angle + 2 * Math.PI) % (2 * Math.PI);
    }
    // angle in the clockwise direction from the positive x-axis to the line segment from (x1,y1) to (x2,y2) :
    else {
        return (angle + 2 * Math.PI) % (2 * Math.PI);
    }
}



function findCofactorIntervals(reaction: Reaction): ReactionInterval[] {
    let intervals: ReactionInterval[] = [];
    // sort metabolites by angle
    const sortedMetabolites = Object.entries(reaction.metabolitesAngles)
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

    // if no interval between reactants and products :
    previousId = sortedMetabolites[lastIndex]?.id;
    if (intervals.length === 0) {
        sortedMetabolites.forEach((currentMetabolite, i) => {
                // is it the interval between the last and the first metabolite ? (special case for calculations)
                if (i === 0) {
                    firstInterval=true;
                }else{
                    firstInterval=false;
                }
                // new interval
                const interval= createInterval(reaction,previousId,currentMetabolite.type,currentMetabolite.id,currentMetabolite.type,firstInterval);
                intervals.push(interval);
                // update
                previousId= currentMetabolite.id;
        });
    }


    if (intervals.length===0) {
        intervals.push({
            typeInterval: 0, 
            reactant: null,
            product: null,
        })
    };
    return intervals;
}

function createInterval(reaction:Reaction,id1:string,type1:MetaboliteType,id2:string,type2:MetaboliteType,firstInterval:boolean=false):ReactionInterval{
    let typeInterval:number;
    const angles=reaction.metabolitesAngles;
    const reactant= type1 === MetaboliteType.REACTANT ? id1 : id2;
    const product= type1 === MetaboliteType.REACTANT ? id2 : id1; 

    if (angles[reactant].angle<angles[product].angle){
        // 1 if not special case , else 3
        typeInterval=1+2*Number(firstInterval);
    }else{
        // 0 if not special case , else 2
        typeInterval=0+2*Number(firstInterval);
    }

    return{
        typeInterval: typeInterval, 
        reactant: reactant,
        product: product,
    }
}


function biggestInterval(reaction: Reaction): {interval:ReactionInterval,size:number} {
    const intervals = reaction.intervalsAvailables;
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
    const angles=reaction.metabolitesAngles;
    const interval=reaction.intervalsAvailables[intervalIndex];
    // if reactant and product null : return 2*PI 
    if (interval.reactant===null || interval.product===null) return Math.PI*2;
    if (interval.typeInterval===0 || interval.typeInterval===1){
        // |angle1-angle2|
        return Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }else{
        // special case where we want the complementary angle
        return 2*Math.PI-Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }
}


function findSpacingSideCompounds(reaction:Reaction,sizeInterval):{reactant:number,product:number}{
    const reactantNumber=reaction.sideCompoundsReactants.length;
    const productNumber=reaction.sideCompoundsProducts.length;
    return {
        reactant: reactantNumber === 0 ? undefined : sizeInterval / (2 * (reactantNumber+1)),
        product: productNumber === 0 ? undefined : sizeInterval / (2 * (productNumber+1))
    };
}

function giveCoordAllSideCompounds(subgraphNetwork:SubgraphNetwork,reaction:Reaction,factorLength:number=1/2):SubgraphNetwork{
    //const distance=reaction.medianMinMaxLengthLink[medianMinMax]* factorLength;
    let baseLengthPixel:number;
    if (subgraphNetwork.stats["minEdgeLengthPixel"]){
        baseLengthPixel=subgraphNetwork.stats["minEdgeLengthPixel"];
    }else{
        console.error("stats minLength not found, use default value 1 inche");
        baseLengthPixel=pixelsToInches(1);
    }
    const distance=baseLengthPixel*factorLength;
    const sideCompounds=subgraphNetwork.sideCompounds[reaction.id];
    const reactionCoord=subgraphNetwork.network.value.nodes[reaction.id];
    // Reactants Placement
    const startReactant= reaction.intervalsAvailables[0].reactant;
    let startAngle=startReactant?reaction.metabolitesAngles[startReactant].angle:0;
    sideCompounds.reactants.forEach((sideCompoundNode,i)=>{
        let direction:number;
        const typeInterval=reaction.intervalsAvailables[0].typeInterval;
        if (typeInterval===0 || typeInterval===3){
            direction=-1; // go left
        } else if (typeInterval===1 || typeInterval===2){
            direction=1; // go right
        }
        const angle:number=startAngle + direction * (i+1) *reaction.angleSpacingReactant;

        sideCompoundNode=giveCoordSideCompound(sideCompoundNode,angle,reactionCoord,distance);
    });
    // Products Placement
    const startProduct= reaction.intervalsAvailables[0].product;
    startAngle=startProduct?reaction.metabolitesAngles[startProduct].angle:0;
    sideCompounds.products.forEach((sideCompoundNode,i)=>{
        let direction:number;
        const typeInterval=reaction.intervalsAvailables[0].typeInterval;
        if (typeInterval===0 || typeInterval===3){
            direction=1; // go right
        } else if (typeInterval===1 || typeInterval===2){
            direction=-1; // go left
        }
        const angle:number=startAngle+ direction * (i+1) *reaction.angleSpacingProduct;
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
    Object.keys(reaction.sideCompoundsReactants).forEach((reactant)=>{
        insertSideCompoundInNetwork(subgraphNetwork,reaction.id,sideCompounds.reactants[reactant],MetaboliteType.REACTANT);
    });
    // Products
    Object.keys(reaction.sideCompoundsProducts).forEach((product)=>{
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


