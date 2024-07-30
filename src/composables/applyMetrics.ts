import { ref } from "vue";
import { getContentFromURL, importNetworkFromURL } from "./importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";


export async function analyseAllJSON(pathListJSON: string): Promise<void> {
    const jsonFileString = await getContentFromURL(pathListJSON);
    const allJson = jsonFileString.split('\n');
    const resultAllJSON: number[][] = [];

    for (const json of allJson) {
        const resultJSON= await analyseJSON(json);
        resultAllJSON.push(resultJSON);
    }
   console.log(resultAllJSON);
}

async function analyseJSON(json: string): Promise<number[]> {

    // initialize network and networkStyle
    const networkForJSON = ref<Network>({ id: '', nodes: {}, links: [] });
    const networkStyleforJSON = ref<GraphStyleProperties>({
        nodeStyles: {},
        linkStyles: {}
    });
    const resultAnalysis:number[]=[];

    // import network from JSON, and process it
    try {
        importNetworkFromURL(json, networkForJSON, networkStyleforJSON, () => {
        console.log("\n\n---------------------------------------\n"+json);
        resultAnalysis.push(Object.keys(networkForJSON.value.nodes).length);
        resultAnalysis.push(networkForJSON.value.links.length);
    });
    } catch (error) {
        console.error("error file : " + json + "\n"+ error);
    }

    return resultAnalysis;
}