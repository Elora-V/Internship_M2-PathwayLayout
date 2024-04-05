import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeThisNode} from "@metabohub/viz-core";

export async function removeSideCompounds(network:Network){
  const sideCompoundsFile="/public/sideCompounds.txt"
  const sideCompoundsString = await readFromFile(sideCompoundsFile);
  const lines = sideCompoundsString.split('\n');
  lines.forEach((line: string) => {
    const dataLine = line.split('\t');
    removeThisNode(dataLine[0], network);
  })
}



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


