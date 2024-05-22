import type { Ref } from "vue";
import type { Network } from "@metabohub/viz-core/src/types/Network";
import type { GraphStyleProperties } from "@metabohub/viz-core/src//types/GraphStyleProperties";

import { readJsonGraph } from "./readJson";
import { sbml2json } from "./SBMLtoJSON";



/**
 * Import network at JSONGraph format from an URL.
 * @param url URL to get network data
 * @param network Reference to network object
 * @param networkStyle Reference to networkStyle object
 * @param callbackFunction Function to call after network load (opt)
 */
export function importNetworkFromURL(url: string, network: Ref<Network>, networkStyle: Ref<GraphStyleProperties>, callbackFunction = () => {}): void {
	setTimeout(async function() {
		let data:string = await getContentFromURL(url);
		// Check if the data is XML
		if (data.startsWith('<?xml')) {
			// Convert XML to JSON
			data = JSON.stringify(await sbml2json(data));
		}
		const graphData = readJsonGraph(data);
		networkStyle.value = graphData.networkStyle;
		loadNetwork(graphData.network, network).then(() => {
      callbackFunction();
		});
	}, 1);
}


/**
 * Import network at JSONGraph format from a file.
 * @param file File to get network data
 * @param network Reference to network object
 * @param networkStyle Reference to networkStyle object
 * @param callbackFunction Function to call after network load (opt)
 */

export function importNetworkFromFile(file: File, network: Ref<Network>, networkStyle: Ref<GraphStyleProperties>, callbackFunction = () => {}): void {
	const reader = new FileReader();
	reader.onload = async function () {
		let data = reader.result as string;
		if (data.startsWith('<?xml')) {
			// Convert XML to JSON
			data = JSON.stringify(await sbml2json(data));
		}
		const networkData = readJsonGraph(data);
		networkStyle.value = networkData.networkStyle;
    loadNetwork(networkData.network, network).then(() => {
			callbackFunction();
		});
	}

	reader.readAsText(file);
}


/**
 * Make async the step where the data are put in network reference. 
 * That permit to chain with another function like rescale.
 * @param data network data
 * @param network Reference to network object
 */
async function loadNetwork(data: Network, network: Ref<Network>): Promise<void> {
	network.value = data;
  }


/**
 * Fetch url to return data
 * @param url URL to fetch 
 * @returns Return response
 */
export async function getContentFromURL(url: string): Promise<string> {
	try {
	  const response = await fetch(url);
	  if (!response.ok) {
		throw new Error('La requête a échoué avec le statut ' + response.status);
	  }
	  const content = await response.text();
	  return content;
	} catch (error) {
	  console.error('Une erreur s\'est produite lors de la récupération du contenu du fichier :', error);
	  throw error;
	}
  }
  
  

