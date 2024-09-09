// Type imports
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { Node } from "@metabohub/viz-core/src/types/Node";
import { MetaboliteType, Reaction, ReactionInterval } from "@/types/Reaction";
import { VizArgs } from "@/types/EnumArgs";
import { Coordinate } from "@/types/CoordinatesSize";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";

// Composable imports
import { getContentFromURL } from "./importNetwork";
import { removeAllSelectedNodes , duplicateAllNodesByAttribut} from "@metabohub/viz-core";
import { getMeanNodesSizePixel, inchesToPixels, minEdgeLength as minEdgeLength, pixelsToInches } from "./CalculateSize";
import { getAttributSideCompounds, isDuplicate, isReaction, isSideCompound, setAsSideCompound } from "./GetSetAttributsNodes";

// General imports
import { e, S } from "vitest/dist/reporters-1evA5lom";
import { c } from "vite/dist/node/types.d-aGj9QkWt";
import { resolve } from "path";
import { error } from "console";





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
 * -> reinsertionSideCompounds :
 *      reinsert side compounds in the network
 * 
 * -> minEdgeLengthDefault :
 *     calculates the default minimum edge length based on the given subgraph network and a factor
 * 
 * -> updateSideCompoundsReversibleReaction :
 *      updates side compounds for reversed reactions
 * 
 * -> motifStampSideCompound :
 *       applies a motif stamp to place side compound for a reaction
 * 
 * -> initializeReactionSideCompounds :
 *      initializes a reaction for side compounds motif
 * 
 * -> getMetaboliteFromReaction :
 *      retrieves the metabolites associated with a given reaction in a subgraph network
 * 
 * -> angleRadianSegment :
 *      calculates the angle in radians between two points
 * 
 * -> addSideCompoundsIntervals :
 *      finds the cofactor intervals for a given reaction
 * 
 * -> addIntervalsBetweenMetabolites :
 *      finds intervals between metabolites in a reaction
 * 
 * -> addInterval :
 *      creates a reaction interval based on the given parameters
 * 
 * -> biggestInterval :
 *      finds the biggest interval (between two metabolites) in all intervals of a reaction
 * 
 * -> sizeInterval :
 *      calculates the size of an interval (between two metabolites) in a reaction
 * 
 * -> findSpacingSideCompounds :
 *      finds spacing between side compounds
 * 
 * -> giveCoordAllSideCompounds :
 *      calculates the coordinates for all side compounds in a subgraph network
 * 
 * -> calculateDistance :
 *      calculates the distance between two points
 * 
 * -> placeSideCompounds :
 *     places a type of side compounds (reactants or products) around a reaction
 * 
 * -> determineDirection :
 *     determines the direction of the angle of the side compound
 * 
 * -> giveCoordSideCompound :
 *     calculates the coordinates for a side compound 
 * 
 * -> insertAllSideCompoundsInNetwork :
 *      inserts all side compounds in the network
 * 
 * -> insertSideCompoundInNetwork :
 *      inserts a side compound in the network
 * 
 * 
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
    let listIDSideCompounds:string[];
    const network = subgraphNetwork.network.value;
    try {
        listIDSideCompounds = await getIDSideCompoundsFromFile(pathListSideCompounds);
        const sideCompoundInNetwork = Object.keys(network.nodes).filter(id => listIDSideCompounds.includes(id));
        return sideCompoundInNetwork;
    } catch (error) {
        throw error;
    }   
}

/**
 * Return the list of id of side compounds from a file
 * @param pathListSideCompounds path to the list of id of side compounds
 * @returns list of id of side compounds
 */
async function getIDSideCompoundsFromFile(pathListSideCompounds:string):Promise<string[]>{
    try {
        const sideCompoundsFile=pathListSideCompounds;
        const sideCompoundsString = await getContentFromURL(sideCompoundsFile);
        const lines = sideCompoundsString.split('\n');
        const listId: Array<string> = [];
        lines.forEach((line: string) => {
        listId.push(line.split('\t')[0]);
        })
        return listId;
    }catch (error) {
        throw error;
    }
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
    try {
        // finding side compounds in network
        if (addSideCompoundAttribute){
            await addSideCompoundAttributeFromList(subgraphNetwork,pathListSideCompounds);
        }
        // duplication of side compounds
        if (doDuplicateSideCompounds){
            await duplicateSideCompound(subgraphNetwork);
        }
        // remove side compounds from network, they are keeped aside in subgraphNetwork.sideCompounds
        if (doPutAsideSideCompounds){
            return removeSideCompoundsFromNetwork(subgraphNetwork);
        }
        return subgraphNetwork;
    } catch (error) {
        throw error;
    }
}



/**
 * Duplicates the side compounds in the given subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network containing the side compounds to be duplicated.
 * @returns void
 */
export async function duplicateSideCompound(subgraphNetwork:SubgraphNetwork):Promise<void>{
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
function removeSideCompoundsFromNetwork(subgraphNetwork:SubgraphNetwork): SubgraphNetwork{

    const network = subgraphNetwork.network.value;
    subgraphNetwork.sideCompounds={};
    const listIDCoftactors:string[]=[];

    // for each link, see if the source or target is in the list of side compounds : add information in subgraphNetwork.sideCompounds
    network.links.forEach((link) => {
        // if source is side compound
        if (isSideCompound(link.source)) {
            if(!(link.target.id in subgraphNetwork.sideCompounds)){
                subgraphNetwork.sideCompounds[link.target.id]={reactants:[],products:[]};
            }
            subgraphNetwork.sideCompounds[link.target.id].reactants.push(link.source);
            listIDCoftactors.push(link.source.id);
        }
        // if target is side compound
        if (isSideCompound(link.target)) {
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
export async function reinsertionSideCompounds(subgraphNetwork:SubgraphNetwork,factorMinEdgeLength:number=1/2,doReactionReversible:boolean):Promise<SubgraphNetwork>{
    if(subgraphNetwork.sideCompounds){
        // get information for length of edge for side compounds :
        // get the min length of edge in the network (if not, use default value)
        let minLength=minEdgeLength(subgraphNetwork.network.value,false);
        // get the default value : min lenght if there is no link in the network (when side compounds are removed) :
        if (isNaN(minLength)){
            console.warn('Minimal edge length by default');
            minLength=await minEdgeLengthDefault(subgraphNetwork,factorMinEdgeLength);
        } 
        // add information in subgraphNetwork.stats
        if (!subgraphNetwork.stats) subgraphNetwork.stats={};
        subgraphNetwork.stats.minEdgeLengthPixel=minLength;

        // update side compounds for reversed reactions
        if (doReactionReversible){
            subgraphNetwork= await updateSideCompoundsReversibleReaction(subgraphNetwork);
        }

        // for each reaction, apply motif stamp
        Object.keys(subgraphNetwork.sideCompounds).forEach( async (reactionID)=>{
            subgraphNetwork= await motifStampSideCompound(subgraphNetwork,reactionID,factorMinEdgeLength);
        });       
    }
    return subgraphNetwork;

}

/**
 * Calculates the default minimum edge length based on the given subgraph network and a factor.
 * 
 * @param subgraphNetwork - The subgraph network object.
 * @param factorMinEdgeLength - The factor to multiply the calculated minimum edge length by.
 * @returns The calculated minimum edge length.
 */
async function minEdgeLengthDefault(subgraphNetwork:SubgraphNetwork,factorMinEdgeLength:number):Promise<number>{
    const network = subgraphNetwork.network.value;
    const networkStyle = subgraphNetwork.networkStyle.value;
    const meanSize=await getMeanNodesSizePixel(Object.values(network.nodes),networkStyle, false);
    const defaultSep=(meanSize.height+meanSize.width)/2;
    const rankSep=subgraphNetwork.attributs[VizArgs.RANKSEP]?inchesToPixels(subgraphNetwork.attributs[VizArgs.RANKSEP] as number):defaultSep;
    const nodeSep=subgraphNetwork.attributs[VizArgs.NODESEP]?inchesToPixels(subgraphNetwork.attributs[VizArgs.NODESEP] as number):defaultSep;
    //const invFactor=factorMinEdgeLength===0?1:1/factorMinEdgeLength;
    return (nodeSep+rankSep)/2*factorMinEdgeLength; 
}

/**
 * Inverse product and reactant for reaction that are the duplicated version of the original reaction : they have been reversed.
 * @param subgraphNetwork 
 * @returns subgraphNetwork updated
 */
async function updateSideCompoundsReversibleReaction(subgraphNetwork:SubgraphNetwork):Promise<SubgraphNetwork>{
    const network = subgraphNetwork.network.value;
    Object.keys(subgraphNetwork.sideCompounds).forEach((reactionID)=>{
        if (!(reactionID in network.nodes)) throw new Error("Reaction not in subgraphNetwork")
        // if reaction has been reversed : exchange products and reactants
        if(network.nodes[reactionID].metadataLayout && network.nodes[reactionID].metadataLayout.isReversedVersion){
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
async function motifStampSideCompound(subgraphNetwork:SubgraphNetwork,reactionID:string,factorMinEdgeLength:number=1/2):Promise<SubgraphNetwork>{
    //try {
        // initialize reaction stamp
        let reaction= await initializeReactionSideCompounds(subgraphNetwork,reactionID);
        // find intervals between reactants and products
        reaction = await addSideCompoundsIntervals(reaction);
        // find the biggest interval
        const biggest= await biggestInterval(reaction);
        reaction.intervalsAvailables=[biggest.interval];
        // find spacing between side compounds
        const spacing= await findSpacingSideCompounds(reaction,biggest.size);
        reaction.angleSpacingReactant=spacing.reactant;
        reaction.angleSpacingProduct=spacing.product;
        // give coordinates to all side compounds
        subgraphNetwork= await giveCoordAllSideCompounds(subgraphNetwork,reaction,factorMinEdgeLength);
        // insert side compounds in network
        insertAllSideCompoundsInNetwork(subgraphNetwork,reaction);
    // } catch (error) {
    //     throw new Error("Error in motifStampSideCompound, reaction : "+ reactionID+ "\n"+error);
    // }
    return subgraphNetwork;
}


/***********************************************************************/
//______________2.1  Stamp motif : initialization


/**
 * Initializes a reaction for side compounds motif
 * 
 * @param subgraphNetwork - The subgraph network containing the reaction and side compounds.
 * @param idReaction - The ID of the reaction.
 * @returns The initialized Reaction object with side compounds and metabolite angles.
 * @throws Error if the reaction is not found in the network.
 */
async function initializeReactionSideCompounds(subgraphNetwork:SubgraphNetwork,idReaction:string):Promise<Reaction>{
    const network = subgraphNetwork.network.value;
    if (network.nodes[idReaction] && subgraphNetwork.sideCompounds && subgraphNetwork.sideCompounds[idReaction]){
        try {
            // position of reaction
            const x=network.nodes[idReaction].x;
            const y=network.nodes[idReaction].y;
            // reactant side compounds
            const reactantSideCompounds=subgraphNetwork.sideCompounds[idReaction].reactants.map((node)=>node.id);
            // product side compounds
            const productSideCompounds=subgraphNetwork.sideCompounds[idReaction].products.map((node)=>node.id);
            // angle metabolites (but side compounds) associated with the reaction
            const angleMetabolites:{[key:string]:{angle:number,type:MetaboliteType}}={};
            const metabolitesReaction= await getMetaboliteFromReaction(subgraphNetwork,idReaction);
            metabolitesReaction.forEach((metabolite)=>{
                const xMetabolite=network.nodes[metabolite.id].x;
                const yMetabolite=network.nodes[metabolite.id].y;
                const angle= angleRadianSegment(x,y,xMetabolite,yMetabolite);
                angleMetabolites[metabolite.id]={angle:angle,type:metabolite.type};
            });
            return {
                id:idReaction,
                sideCompoundsReactants:reactantSideCompounds,
                sideCompoundsProducts:productSideCompounds,
                metabolitesAngles:angleMetabolites,
            };
        } catch (error) {
            throw error;
        }       
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
async function getMetaboliteFromReaction(subgraphNetwork: SubgraphNetwork, idReaction: string): Promise<{ id: string; type: MetaboliteType }[]> {
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
        //console.error("Invalid coordinates for angle : one or more coordinates are not finite numbers.");
        throw new Error("Invalid coordinates for angle : one or more coordinates are not finite numbers."); 
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

/***********************************************************************/
//______________2.2  Stamp motif : find intervals



/**
 * Finds the cofactor intervals for a given reaction. If possible, the intervals are found between reactants and products.
 * 
 * @param reaction - The reaction object.
 * @returns An array of ReactionInterval objects representing the cofactor intervals.
 */
async function addSideCompoundsIntervals(reaction: Reaction):Promise<Reaction> {

    try {
        // Sort metabolites by angle
        const sortedMetabolites = Object.entries(reaction.metabolitesAngles)
        .map(([id, {angle, type}]) => ({id, angle, type}))
        .sort((a, b) => {
            if (isNaN(a.angle)) return 1; // Place `a` after `b` if `a.angle` is `NaN`
            if (isNaN(b.angle)) return -1; // Place `b` after `a` if `b.angle` is `NaN`
            return a.angle - b.angle; // Normal comparison if both angles are numbers
        });

        // Initialisation
        if (!sortedMetabolites || sortedMetabolites.length === 0) {
            throw new Error("No sorted metabolite for side compounds insertion");
        }

        const lastIndex = sortedMetabolites.length - 1;
        let previousType = sortedMetabolites[lastIndex]?.type;
        let previousId = sortedMetabolites[lastIndex]?.id;

        // Process sorted metabolites to find intervals between reactants and products
        reaction = await addIntervalsBetweenMetabolites(reaction,sortedMetabolites, previousId, previousType,true);

        // If no interval between reactants and products
        if (!reaction.intervalsAvailables || reaction.intervalsAvailables.length === 0) {
            reaction = await addIntervalsBetweenMetabolites(reaction,sortedMetabolites, previousId, previousType,false);
        }

        // If still no intervals, add a default interval
        if (!reaction.intervalsAvailables || reaction.intervalsAvailables.length === 0) {
            reaction.intervalsAvailables =[{
                typeInterval: 0, 
                reactant: null,
                product: null,
            }];
        }

        return reaction;
    } catch(error){
        throw error;
    }
}

    
/**
 * Finds intervals between metabolites in a reaction.
 * 
 * @param reaction - The reaction to add intervals to.
 * @param sortedMetabolites - An array of sorted metabolites.
 * @param firstPreviousID - The ID of the first previous metabolite.
 * @param firstPreviousType - The type of the first previous metabolite.
 * @param checkChangeType - Optional. Specifies whether to ask for a change in metabolite type to be considered as an interval. Defaults to true.
 * @returns The reaction with added intervals.
 */
async function addIntervalsBetweenMetabolites(reaction:Reaction,sortedMetabolites: {id: string, angle: number, type: MetaboliteType}[], firstPreviousID: string, firstPreviousType: MetaboliteType, checkChangeType: boolean = true):Promise<Reaction> {
    let firstInterval = false;
    sortedMetabolites.forEach((currentMetabolite, i) => {
        if ( !checkChangeType || (currentMetabolite.type !== firstPreviousType)) {
            firstInterval = (i === 0);
            reaction = addInterval(reaction, firstPreviousID, firstPreviousType, currentMetabolite.id, firstInterval);
        }
        firstPreviousType = currentMetabolite.type;
        firstPreviousID = currentMetabolite.id;
    });
    return reaction;
}

/**
 * Creates a reaction interval based on the given parameters.
 * Type of interval is 1 if reactant then product, 0 if product then reactant,
 * or special case if the x-axis is between the two metabolites : 3 if reactant is the smaller angle, 2 if product is the smaller angle.
 * 
 * @param reaction - The reaction object.
 * @param id1 - The first metabolite ID.
 * @param type1 - The type of the first metabolite.
 * @param id2 - The second metabolite ID.
 * @param firstInterval - Optional. Indicates if it's the first interval. Defaults to false.
 * @returns The created reaction interval.
 */
function addInterval(reaction:Reaction,id1:string,type1:MetaboliteType,id2:string,firstInterval:boolean=false):Reaction{
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

    // add interval in reaction
    if(!reaction.intervalsAvailables) reaction.intervalsAvailables=[];
    reaction.intervalsAvailables.push({typeInterval: typeInterval, reactant: reactant, product: product});
    return reaction;
}

/**
 * Find the biggest interval (between two metabolites) in all intervals of a reaction.
 * @param reaction 
 * @returns the biggest interval and its size
 */
async function biggestInterval(reaction: Reaction): Promise<{interval:ReactionInterval,size:number}> {
    try {
        const intervals = reaction.intervalsAvailables;
        if (intervals.length === 0) {
            throw new Error("Empty intervals");
        }else if (intervals.length === 1) {
            return {interval:intervals[0],size:sizeInterval(reaction,0)};
        }
        // size of intervals
        const sizes = intervals.map((_, index) => sizeInterval(reaction, index));
        // find biggest size
        const maxValue = Math.max(...sizes);
        // Return interval associated
        const maxIndex = sizes.indexOf(maxValue);
        if(maxIndex===-1) throw new Error("No interval of max size found");
        return {interval:intervals[maxIndex],size:maxValue};
    }catch(error){
        throw error;
    }
}


/**
 * Calculates the size of an interval (between two metabolites) in a reaction, depending on the type of interval.
 * Type of interval is 1 if reactant then product, 0 if product then reactant,
 * or special case if the x-axis is between the two metabolites : 3 if reactant is the smaller angle, 2 if product is the smaller angle.
 * 
 * @param reaction - The reaction object.
 * @param intervalIndex - The index of the interval to process, in all the intervals of the reaction .
 * @returns The size of the interval in radians.
 * @throws {Error} If the angles or interval are undefined.
 */
function sizeInterval(reaction:Reaction,intervalIndex:number):number{
    const angles=reaction.metabolitesAngles;
    if (angles===undefined) throw new Error("No angles");
    const interval=reaction.intervalsAvailables[intervalIndex];
    if (interval===undefined) throw new Error("No interval");
    // if reactant or product null : return 2*PI 
    if (!interval.reactant || !interval.product) return Math.PI*2;
    if (interval.typeInterval===0 || interval.typeInterval===1){
        // |angle1-angle2|
        return Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }else{
        // special case where we want the complementary angle
        return 2*Math.PI-Math.abs(angles[interval.product].angle-angles[interval.reactant].angle);
    }
}

/***********************************************************************/
//______________2.3  Stamp motif : find spacing


async function findSpacingSideCompounds(reaction:Reaction,sizeInterval:number):Promise<{reactant:number,product:number}>{
    const reactantNumber=reaction.sideCompoundsReactants.length;
    const productNumber=reaction.sideCompoundsProducts.length;
    return {
        reactant: reactantNumber === 0 ? undefined : sizeInterval / (2 * (reactantNumber+1)),
        product: productNumber === 0 ? undefined : sizeInterval / (2 * (productNumber+1))
    };
}

/***********************************************************************/
//______________2.4  Stamp motif : give coordinates


/**
 * Calculates the coordinates for all side compounds in a subgraph network.
 * 
 * @param subgraphNetwork - The subgraph network containing the side compounds.
 * @param reaction - The reaction for which the side compounds are being calculated.
 * @param factorLength - The factor length used for edge length of side compounds. Default value is 1/2.
 * @returns The updated subgraph network with the calculated coordinates for the side compounds.
 */
async function giveCoordAllSideCompounds(subgraphNetwork:SubgraphNetwork,reaction:Reaction,factorLength:number=1/2):Promise<SubgraphNetwork>{
    const distance=calculateDistance(subgraphNetwork, factorLength);
    const sideCompounds=subgraphNetwork.sideCompounds[reaction.id];
    const reactionCoord=subgraphNetwork.network.value.nodes[reaction.id];
    // Reactants Placement
    if (sideCompounds.reactants && sideCompounds.reactants.length>0){
        await placeSideCompounds(sideCompounds.reactants, reaction, reactionCoord, distance, true);
    }
    // Products Placement
    if (sideCompounds.products && sideCompounds.products.length>0){
        await placeSideCompounds(sideCompounds.products, reaction, reactionCoord, distance, false);
    }
   
    return subgraphNetwork;
}

/**
 * Calculates the distance based on the given subgraph network and factor length.
 * If the minimum edge length of the graph is available in the statistics,
 * it uses that value : minimum edge length * factor . Otherwise, it uses a default value of 1 inch * factor.
 * 
 * @param subgraphNetwork - The subgraph network to calculate the distance for.
 * @param factorLength - The factor length to multiply the base length by.
 * @returns The calculated distance.
 */
function calculateDistance(subgraphNetwork: SubgraphNetwork, factorLength: number): number {
    let baseLengthPixel: number;
    if (subgraphNetwork.stats.minEdgeLengthPixel) {
        baseLengthPixel = subgraphNetwork.stats.minEdgeLengthPixel;
    } else {
        console.error("stats minEdgeLengthPixel not found, use default value 1 inch");
        baseLengthPixel = pixelsToInches(1);
    }
    return baseLengthPixel * factorLength;
}


/**
 * Places a type of side compounds (reactants or products) around a reaction.
 * 
 * @param sideCompounds - An array of side compounds (node) to be placed.
 * @param reaction - The reaction object.
 * @param reactionCoord - The coordinates of the reaction.
 * @param distance - The distance from the reaction to place the side compounds.
 * @param placeReactants - A boolean indicating whether to place reactants or products.
 */
async function placeSideCompounds(sideCompounds: Array<Node>, reaction: Reaction, reactionCoord: Coordinate, distance: number, placeReactants: boolean): Promise<void> {
    const startSideCompound = placeReactants ? reaction.intervalsAvailables[0].reactant : reaction.intervalsAvailables[0].product;
    if (!startSideCompound) {
        console.error("No start side compound found");
        return;
    }
    let startAngle = startSideCompound ? reaction.metabolitesAngles[startSideCompound].angle : 0;
    const angleSpacing = placeReactants ? reaction.angleSpacingReactant : reaction.angleSpacingProduct;
    if (!isFinite(angleSpacing)) {
        console.error("No angle spacing found");
        return;
    }

    sideCompounds.forEach((sideCompoundNode, i) => {
        const direction = determineDirection(reaction.intervalsAvailables[0].typeInterval, placeReactants);
        const angle = startAngle + direction * (i + 1) * angleSpacing;
        sideCompoundNode = giveCoordSideCompound(sideCompoundNode, angle, reactionCoord, distance);
    });
}

/**
 * Determines the direction based on the type interval and whether to place reactants.
 * Type of interval is 1 if reactant then product, 0 if product then reactant,
 * or special case if the x-axis is between the two metabolites : 3 if reactant is the smaller angle, 2 if product is the smaller angle.
 * 
 * @param typeInterval - The type interval value.
 * @param placeReactants - A boolean indicating whether to place reactants.
 * @returns The direction value (-1 or 1).
 */
function determineDirection(typeInterval: number, placeReactants: boolean): number {
    if (placeReactants) {
        return (typeInterval === 0 || typeInterval === 3) ? -1 : 1;
    } else {
        return (typeInterval === 0 || typeInterval === 3) ? 1 : -1;
    }
}

/**
 * Calculates the coordinates of a side compound from a reaction based on the given parameters.
 * A reaction node is considered the center of the circle where the side compound is added.
 * 
 * @param sideCompound - The side compound node.
 * @param angle - The angle in radians to place side compound in the circle.
 * @param center - The center of the circle (coordinates of reaction).
 * @param distance - The distance from the center.
 * @returns The side compound node with updated coordinates.
 */
function giveCoordSideCompound(sideCompound:Node,angle:number,center:{x:number,y:number},distance:number):Node{
    sideCompound.x = center.x + distance * Math.cos(angle);
    sideCompound.y = center.y + distance * Math.sin(angle);
    return sideCompound;
}


/***********************************************************************/
//______________2.4  Stamp motif : insertion in network


/**
 * Inserts all side compounds of a reaction into the network.
 * 
 * @param subgraphNetwork - The subgraph network to insert the side compounds into.
 * @param reaction - The reaction containing the side compounds.
 * @returns void
 */
function insertAllSideCompoundsInNetwork(subgraphNetwork:SubgraphNetwork,reaction:Reaction):void{
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

/**
 * Inserts a side compound into the network.
 * 
 * @param subgraphNetwork - The subgraph network to insert the side compound into.
 * @param reactionID - The ID of the reaction.
 * @param sideCompound - Node : The side compound to insert.
 * @param typeSideCompound - The type of the side compound (reactant or product).
 */
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


