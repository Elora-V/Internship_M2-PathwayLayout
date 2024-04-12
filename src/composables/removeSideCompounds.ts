import { Network } from "@metabohub/viz-core/src/types/Network";
import { removeAllSelectedNode } from "@metabohub/viz-core";
import {getContentFromURL} from "./importNetwork"

/**
 * Remove side compounds of a network, the list of side compounds is predefined
 * @param {Network} Network that need removing of nodes
 */
export async function removeSideCompounds(network:Network,pathListSideCompounds:string){

  console.log('remove SC');

  const sideCompoundsFile=pathListSideCompounds;
  const sideCompoundsString = await getContentFromURL(sideCompoundsFile);
  const lines = sideCompoundsString.split('\n');
  const listId: Array<string> = [];
  lines.forEach((line: string) => {
    listId.push(line.split('\t')[0]);
  })
  removeAllSelectedNode(listId,network);
}


