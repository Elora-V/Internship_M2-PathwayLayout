import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeAllSelectedNode } from "@metabohub/viz-core";


/**
 * Remove side compounds of a network, the list of side compounds is predefined
 * @param {Network} Network that need removing of nodes
 */
export async function removeSideCompounds(network:Network){
  const sideCompoundsFile="/public/sideCompounds.txt"
  const sideCompoundsString = await readFromFile(sideCompoundsFile);
  const lines = sideCompoundsString.split('\n');
  const listId: Array<string> = [];
  lines.forEach((line: string) => {
    listId.push(line.split('\t')[0]);
  })
  removeAllSelectedNode(listId,network);
}


/**
 * Take the path of a file and return its content
 * @param {string} string of path to file
 * @return promise of string
 */
export async function readFromFile(fileName: string): Promise<string> {
    try {
      const response = await fetch(fileName);
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

