import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { getContentFromURL } from "./importNetwork";
import { removeAllSelectedNode } from "@metabohub/viz-core";

export async function removeSideCompoundsFromNetwork(subgraphNetwork:SubgraphNetwork,pathListSideCompounds:string):Promise<SubgraphNetwork>{

    const network = subgraphNetwork.network.value;
    const listIDCoftactors = await getListCofactors(pathListSideCompounds);

    subgraphNetwork.cofactors={};

    // for each link, see if the source or target is in the list of cofactors : add information in subgraphNetwork.cofactors
    network.links.forEach((link) => {
        // if source is cofactor
        if (isCofactor(link.source.id,listIDCoftactors)) {
            if(!(link.target.id in subgraphNetwork.cofactors)){
                subgraphNetwork.cofactors[link.target.id]={reactants:[],products:[]};
            }
            subgraphNetwork.cofactors[link.target.id].reactants.push(link.source);
        }
        // if target is cofactor
        if (isCofactor(link.target.id,listIDCoftactors)) {
            if(!(link.source.id in subgraphNetwork.cofactors)){
                subgraphNetwork.cofactors[link.source.id]={reactants:[],products:[]};
            }
            subgraphNetwork.cofactors[link.source.id].products.push(link.target);
        }
    });

    // remove cofactors from network
    removeAllSelectedNode(listIDCoftactors,network);

    return subgraphNetwork;
}


export async function duplicateSideCompounds(subgraphNetwork:SubgraphNetwork,pathListSideCompounds:string):Promise<void>{
    // ..................
}



async function getListCofactors(pathListCofactors:string):Promise<string[]>{
    const sideCompoundsFile=pathListCofactors;
    const sideCompoundsString = await getContentFromURL(sideCompoundsFile);
    const lines = sideCompoundsString.split('\n');
    const listId: Array<string> = [];
    lines.forEach((line: string) => {
      listId.push(line.split('\t')[0]);
    })
    return listId;
}

function isCofactor(nodeID:string,cofactorsList:string[]):boolean{
    return cofactorsList.includes(nodeID);
}