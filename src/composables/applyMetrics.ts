import { ref } from "vue";
import { getContentFromURL, importNetworkFromURL } from "./importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";
import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { addSideCompoundAttributeFromList, duplicateSideCompound } from "./manageSideCompounds";
import { changeNodeStyles } from "./styleGraph";
import { countIntersection } from "./countIntersections";



export async function analyseAllJSON(pathListJSON: string,applyLayout:(subgraph: SubgraphNetwork) => SubgraphNetwork=defaultApplyLayout): Promise<void> {
    const jsonFileString = await getContentFromURL(pathListJSON);
    const allJson = jsonFileString.split('\n');
    let resultAllJSON: Array<Array<number>> = [];
    let nameFile: string[] = [];

    for (const json of allJson) {
        const resultJSON= await analyseJSON(json,applyLayout);
        if (resultJSON !== undefined){
            nameFile.push(json);
            resultAllJSON.push(resultJSON);
        }
    }
    printArray(resultAllJSON);
}


async function analyseJSON(json: string, applyLayout:(subgraph: SubgraphNetwork) => SubgraphNetwork=defaultApplyLayout): Promise<Array<number> | undefined> {

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
                        ()=>{                       
                        // apply layout
                        subgraphNetwork=applyLayout(subgraphNetwork);
                        // then ( afaire qd on aura le layout)
                        // calculate metrics on resulting layout
                        resultAnalysis=applyMetrics(subgraphNetwork);                 
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



function printArray(data: Array<Array<number>>): void {
    const stringData = data.map(row => row.join(',')).join('\n');
    console.log(stringData);
}



function applyMetrics(subgraphNetwork: SubgraphNetwork): Array<number> {
    const network=subgraphNetwork.network.value;
    const networkStyle=subgraphNetwork.networkStyle.value;
    const result: Array<number>=[];

    result.push(Object.keys(network.nodes).length);
    result.push(network.links.length);
    result.push(countIntersection(network,networkStyle));

    return result;
}


const defaultApplyLayout = (subgraph: SubgraphNetwork): SubgraphNetwork => {
    return subgraph;
};