import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { addNewSubgraph, createSubgraph } from "./UseSubgraphNetwork";
import { TypeSubgraph } from "@/types/Subgraph";


export function addDirectedCycleToSubgraphNetwork(subNetwork:SubgraphNetwork):SubgraphNetwork{
    const onlyDirectedCycle=false;
    const nodes=Object.keys(subNetwork.network.value.nodes);
    const graph=graphForJohnson(subNetwork.network.value,nodes,onlyDirectedCycle);
    const cycles=JohnsonAlgorithm(graph,nodes,"All",onlyDirectedCycle,subNetwork.network.value);
    Object.entries(cycles).forEach(([name, nodes])=>{
        const cycle=createSubgraph(name,nodes,[],TypeSubgraph.CYCLE);
        subNetwork=addNewSubgraph(subNetwork,cycle,TypeSubgraph.CYCLE);
    });
    return subNetwork;
}


export function graphForJohnson(network:Network, list_nodes:string[], onlyDirectedCycle:boolean=true):number[][]{
    let graph: number[][] = Array.from({ length: list_nodes.length }, () => []);
    network.links.forEach(link=>{
        const sourceIndex=list_nodes.indexOf(link.source.id);
        const targetIndex=list_nodes.indexOf(link.target.id);
        graph[sourceIndex].push(targetIndex);
        if(!onlyDirectedCycle){
            graph[targetIndex].push(sourceIndex);
        }
    });
    return graph;
}


export function JohnsonAlgorithm(graph: number[][], list_nodes:string[],flag: "Single" | "All"="All",onlyDirectedCycle:boolean=true,network?:Network): {[key:string]:string[]} {
    const nVertices: number = graph.length;
    let nbcycle:number=0;
    let start: number = 0;
    let Ak:  number[][] = graph; // Ak is the adjacency list of each node
    let B: number[][] = []; // B is the adjacency list of the parent of each node
    let blocked: boolean[] = []; // block search of cycle not starting by start node (it will be done later)
    for (let i = 0; i < nVertices; i++) {
        B.push(Array(nVertices).fill(0));
        blocked[i] = false;
    }
    let stack: (number | null)[] = []; // stack to store the path of the cycle
    for (let i = 0; i < nVertices; i++) {
        stack.push(null);
    }
    let stackTop: number = 0;
    const nbNodeToRun: number = (flag === "Single") ? 1 : nVertices;
    let result: {[key:string]:string[]} ={};

    function unblock(u: number): void { // called when a cycle is found : unblock all parent of u (and u) => allow to find other cycle passing by same nodes (but always starting from start)
        blocked[u] = false;
        // for each parent w of u 
        for (let wPos = 0; wPos < B[u].length; wPos++) {
            let w: number = B[u][wPos];
            
            wPos -= removeFromList(B[u], w); // ???
            if (blocked[w]) {
                unblock(w);
            }
        }
    }

    function circuit(v: number): boolean { 

        let f: boolean = false;
        // Push v to the stack and mark it as blocked
        stackPush(v);
        blocked[v] = true;

        // for each neighbor w of v
        for (let wPos = 0; wPos < Ak[v].length; wPos++) {
            let w: number = Ak[v][wPos];

            // If w is less than start, skip the current iteration because already process this node in previous iteration of start
            if (w < start) {
                continue;
            }
            // if network : node w doesn't taken into account if reversible version in the stack (cycle with only one of the version)
            if(network){ 
                const wNode=network.nodes[list_nodes[w]];
                if( "metadata" in wNode && "reversibleVersion" in wNode.metadata){
                    const stackCopy = stack.slice(0, stackTop);
                    const reactionRev =wNode.metadata["reversibleVersion"] as string;
                    const reversibleNumber=list_nodes.indexOf(reactionRev);
                    if(stackCopy.includes(reversibleNumber)){
                        continue; // the reversible reaction is not processed as the original version is already in the stack
                    }
                }
            }

            // If w is equal to start, a cycle is found (find only cycle that start from start node)
            if (w === start) {
                let cycle: number[] = stack.slice(0, stackTop);


                // If the cycle length is more than 3, add it to the result
                if (cycle.length > 3) {
                    const cycleID:string[]=[];
                    stack.slice(0, stackTop).forEach(nodeIndex=>{
                        cycleID.push(list_nodes[nodeIndex]);
                    });
                    //adding check that not already found in the case of undirected cycle
                    if (!onlyDirectedCycle && !Object.values(result).some(existingCycle => arePermutations(existingCycle, cycleID))) {
                        result["cycle_"+String(nbcycle)]=cycleID;
                        nbcycle+=1;
                    }
                    else if (onlyDirectedCycle) {
                        result["cycle_"+String(nbcycle)]=cycleID;
                        nbcycle+=1;
                    }
                }
                f = true;
            } else if (!blocked[w]) { // If w is not blocked, find a cycle starting from w (dfs principle)
                if (circuit(w)) {
                    f = true;
                }
            }
        }

        // If a cycle is found, unblock v and return true
        if (f) {
            unblock(v);
        } else {
            // for each neighbor w of v
            for (let wPos = 0; wPos < Ak[v].length; wPos++) {
                let w: number = Ak[v][wPos];
                if (w < start) {
                    continue;
                }
                // Add v to the adjacency list of w in B (parent of w)
                if (!B[w].includes(v)) {
                    B[w].push(v);
                }
            }
        }
        v = stackPop();
        return f;
    }

    function stackPush(val: number): void {
        if (stackTop >= stack.length) {
            stack.push(null);
        }
        stack[stackTop++] = val; // set at index and then stackTop++
    }

    function stackPop(): number | null {
        return stack[--stackTop]; // stackTop-- an then get index
    }

    function removeFromList(list: number[], val: number): number {
        let nOcurrences: number = 0;
        let itemIndex: number = 0;
        while ((itemIndex = list.indexOf(val, itemIndex)) > -1) {
            list.splice(itemIndex, 1);
            nOcurrences++;
        }
        return nOcurrences;
    }

    start = 0;
    // for (let i = 0; i < nVertices; i++) {
    //     console.log(String(i)+" "+String(list_nodes[i]));
    // }
    while (start < nbNodeToRun) {
        for (let i = 0; i < nVertices; i++) {
            blocked[i] = false;
            B[i].length = 0;
        }
        circuit(start);
        start++;
    }
    return result;
}

//chatgtp function
function arePermutations(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;

    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();

    for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) return false;
    }

    return true;
}