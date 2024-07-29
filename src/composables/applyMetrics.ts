import { ref } from "vue";
import { getContentFromURL, importNetworkFromURL } from "./importNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { GraphStyleProperties } from "@metabohub/viz-core/src/types/GraphStyleProperties";


export async function analyseAllJSON(pathListJSON: string): Promise<void> {
    const jsonFileString = await getContentFromURL(pathListJSON);
    const allJson = jsonFileString.split('\n');

    for (const json of allJson) {
        await analyseJSON(json);
    }
   
}

async function analyseJSON(json: string): Promise<void> {

    // initialize network and networkStyle
    const networkForJSON = ref<Network>({ id: '', nodes: {}, links: [] });
    const networkStyleforJSON = ref<GraphStyleProperties>({
        nodeStyles: {},
        linkStyles: {}
    });

    // import network from JSON, and process it
    try {
        importNetworkFromURL(json, networkForJSON, networkStyleforJSON, () => {
        console.log("\n\n\n---------------------------------------\n"+json);
        console.log(networkForJSON.value);
    });
    } catch (error) {
        console.error("error file : " + json + "\n"+ error);
    }
}