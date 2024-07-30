import { ref } from "vue";
import { getContentFromURL, importNetworkFromURL } from "./importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";


export async function analyseAllJSON(pathListJSON: string): Promise<void> {
    const jsonFileString = await getContentFromURL(pathListJSON);
    const allJson = jsonFileString.split('\n');
    let resultAllJSON: Array<Array<number>> = [];

    for (const json of allJson) {
        const resultJSON= await analyseJSON(json);
        if (resultJSON !== undefined){
            resultAllJSON.push(resultJSON);
        }
    }
    printArray(resultAllJSON);
}

async function analyseJSON(json: string): Promise<Array<number> | undefined> {

    // initialize network and networkStyle
    const networkForJSON = ref<Network>({ id: '', nodes: {}, links: [] });
    const networkStyleforJSON = ref<GraphStyleProperties>({
        nodeStyles: {},
        linkStyles: {}
    });
    let resultAnalysis: Array<number>;

    // import network from JSON, and process it
    try {
        await new Promise<void>((resolve, reject) => {
            try {
                importNetworkFromURL(json, networkForJSON, networkStyleforJSON, () => {
                    resultAnalysis=applyMetrics(networkForJSON.value, networkStyleforJSON.value);                 
                    resolve();
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

function applyMetrics(network: Network, networkStyle: GraphStyleProperties): Array<number> {
    const result: Array<number>=[];

    result.push(Object.keys(network.nodes).length);
    result.push(network.links.length);

    return result;
}