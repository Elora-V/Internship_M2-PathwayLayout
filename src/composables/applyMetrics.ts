import { ref } from "vue";
import { getContentFromURL, importNetworkFromURL } from "./importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { addSideCompoundAttributeFromList, duplicateSideCompound, putDuplicatedSideCompoundAside } from "./manageSideCompounds";
import { changeNodeStyles } from "./styleGraph";
import { countIntersection } from "./countIntersections";
import { createStaticForceLayout } from "@metabohub/viz-core";
import { Parameters,defaultParameters } from "@/types/Parameters";
import { vizLayout } from "./useLayout";
import { allSteps } from "./useAlgo";
import { Algo, PathType } from "@/types/EnumArgs";
import { countIntersectionEdgeNetwork, countOverlapNodeNetwork, countOverlapNodeEdgeNetwork, countDifferentCoordinatesNodeNetwork, countNodes, countEdges } from "./metricsNetwork";


export async function analyseAllJSON(pathListJSON: string,algo:Algo=Algo.DEFAULT): Promise<void> {
    const jsonFileString = await getContentFromURL(pathListJSON);
    const allJson = jsonFileString.split('\n');
    let resultAllJSON: Array<Array<number>> = [];
    let nameFile: string[] = [];
    const nameColumn: string[] = ['nodes', 'node not side compound','edges', 'node overlap', 'edge node overlap', 'different x (not SD)' ,'different y (not SD)','edge intersections'];

    // which layout to apply
    let applyLayout: (subgraph: SubgraphNetwork) => Promise<SubgraphNetwork> =defaultApplyLayout;
    switch (algo) {
        // case Algo.FORCE:
        //     console.log('apply Force');
        //     applyLayout = applyForceLayout;
        //     break;
        case Algo.VIZ:
            console.log('apply Viz');
            applyLayout = applyVizLayout;
            break;
        case Algo.ALGO:
            console.log('applyAlgo : default');
            applyLayout = applyAlgo;
            break;
        case Algo.ALGO_V0:
            console.log('applyAlgo_V0: no main chain');
            applyLayout = applyAlgo_V0;
            break;
        case Algo.ALGO_V1:
            console.log('applyAlgo_V1 : longuest');
            applyLayout = applyAlgo_V1;
            break;
        case Algo.ALGO_V3:
            console.log('applyAlgo_V3 : all');
            applyLayout = applyAlgo_V3;
            break;
        default:
            console.log('no change');
            applyLayout = defaultApplyLayout;
            break;
    }

    for (const json of allJson) {
        const resultJSON= await analyseJSON(json,applyLayout);
        if (resultJSON !== undefined){
            nameFile.push(json);
            resultAllJSON.push(resultJSON);
        }
    }  
    print1DArray(nameColumn);
    print2DArray(resultAllJSON);
    console.warn("If apply metrics on another layout : refresh the page, else results are the same than last time (idk why)");
    console.warn('Number of different coordinates are calculated without side compounds');
}


async function analyseJSON(json: string, applyLayout: (subgraph: SubgraphNetwork) => Promise<SubgraphNetwork> =defaultApplyLayout): Promise<Array<number> | undefined> {

    // initialize objects
    const networkForJSON = ref<Network>({ id: '', nodes: {}, links: [] });
    const networkStyleforJSON = ref<GraphStyleProperties>({
        nodeStyles: {},
        linkStyles: {}
    });
    let subgraphNetwork:SubgraphNetwork;
    let resultAnalysis: Array<number>;

    // import network from JSON, and process it
    try {
        await new Promise<void>((resolve, reject) => {
            try {
                importNetworkFromURL(json, networkForJSON, networkStyleforJSON, () => {
                    //// Callback function (after network imported) :

                    // set style (same for all)
                    changeNodeStyles(networkStyleforJSON.value);
                    // create subgraphNetwork object
                    subgraphNetwork={network:networkForJSON,networkStyle:networkStyleforJSON,attributs:{},mainChains:{}};
                    // duplicate side compounds 
                    addSideCompoundAttributeFromList(subgraphNetwork,"/sideCompounds.txt").then(
                        ()=>{
                        duplicateSideCompound(subgraphNetwork);
                        }
                    ).then(
                        async ()=>{                       
                        // apply layout
                        subgraphNetwork=await applyLayout(subgraphNetwork);
                        }
                    ).then(
                        ()=>{
                        // calculate metrics on resulting layout
                        resultAnalysis=applyMetrics(subgraphNetwork,true);                 
                        resolve();
                        }
                    );
                    
                });
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        console.error("error file : " + json + "\n" + error);
        return undefined;
    }

    return resultAnalysis;
}

function print1DArray(data: Array<string|number|boolean>): void {
    const stringData = data.join(',');
    console.log(stringData);
}

function print2DArray(data: Array<Array<string|number|boolean>>): void {
    const stringData = data.map(row => row.join(',')).join('\n');
    console.log(stringData);
}



const defaultApplyLayout = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    return subgraphNetwork;
};

// const applyForceLayout = (subgraphNetwork: SubgraphNetwork): SubgraphNetwork => {
//     const network=subgraphNetwork.network.value;
//     createStaticForceLayout(network);
//     return subgraphNetwork;
// };

const applyVizLayout = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    let parameters: Parameters = defaultParameters;
    const subgraphNetworkPromise = new Promise<SubgraphNetwork>((resolve, reject) => {
        resolve(vizLayout(subgraphNetwork, false, false, parameters.addNodes, parameters.groupOrCluster, false, false, parameters.dpi, parameters.numberNodeOnEdge))
    })
    return subgraphNetworkPromise;
};

const applyAlgo = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    let parameters: Parameters=defaultParameters;
    const subgraphNetworkPromise = new Promise<SubgraphNetwork>((resolve, reject) => {
        resolve(allSteps(subgraphNetwork,parameters,false));
    })
    return subgraphNetworkPromise;
};

const applyAlgo_V0 = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    let parameters: Parameters=defaultParameters;
    parameters.mainchain=false;
    const subgraphNetworkPromise = new Promise<SubgraphNetwork>((resolve, reject) => {
        resolve(allSteps(subgraphNetwork,parameters,false));
    })
    return subgraphNetworkPromise;
};

const applyAlgo_V1 = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    let parameters: Parameters=defaultParameters;
    parameters.pathType=PathType.LONGEST;
    const subgraphNetworkPromise = new Promise<SubgraphNetwork>((resolve, reject) => {
        resolve(allSteps(subgraphNetwork,parameters,false));
    })
    return subgraphNetworkPromise;
};

const applyAlgo_V3 = async (subgraphNetwork: SubgraphNetwork): Promise<SubgraphNetwork> => {
    let parameters: Parameters=defaultParameters;
    parameters.pathType=PathType.ALL;
    const subgraphNetworkPromise = new Promise<SubgraphNetwork>((resolve, reject) => {
        resolve(allSteps(subgraphNetwork,parameters,false));
    })
    return subgraphNetworkPromise;
};




export function applyMetrics(subgraphNetwork: SubgraphNetwork, coordAreCenter:boolean=true): Array<number> {
    const network=subgraphNetwork.network.value;
    const networkStyle=subgraphNetwork.networkStyle.value;
    const result: Array<number>=[];

    // number of nodes
    result.push(countNodes(network,true));
    // number of nodes not side compounds
    result.push(countNodes(network,false));
    // number of edges
    result.push(countEdges(network,true));
    // number of node overlap
    result.push(countOverlapNodeNetwork(network,networkStyle,coordAreCenter));
    // number of edge node overlap
    result.push(countOverlapNodeEdgeNetwork(network,networkStyle,coordAreCenter));
    // number of different x and y coordinates (without side compounds)
    const countDiffCoord=countDifferentCoordinatesNodeNetwork(network,networkStyle,coordAreCenter,false);
    result.push(countDiffCoord.x);
    result.push(countDiffCoord.y);
    // number of edges intersections
    result.push(countIntersectionEdgeNetwork(network,networkStyle,coordAreCenter));


    return result;
}
