import { SubgraphNetwork } from "@/types/SubgraphNetwork";
import { Network } from "@metabohub/viz-core/src/types/Network";
import { createSubgraph } from "./UseSubgraphNetwork";
import { TypeSubgraph } from "@/types/Subgraph";


export function addCycleToSubgraphNetwork(subNetwork:SubgraphNetwork):SubgraphNetwork{
    const nodes=Object.keys(subNetwork.network.value.nodes);
    const graph=graphForJohnson(subNetwork.network.value,nodes);
    const cycles=JohnsonAlgorithm(graph,nodes);
    Object.entries(cycles).forEach(([name, nodes])=>{
        subNetwork.cycles[name]=createSubgraph(name,nodes,[],TypeSubgraph.CYCLE);
    });
    return subNetwork;
}


export function graphForJohnson(network:Network, list_nodes:string[]):number[][]{
    let graph: number[][] = Array.from({ length: list_nodes.length }, () => []);
    network.links.forEach(link=>{
        const sourceIndex=list_nodes.indexOf(link.source.id);
        const targetIndex=list_nodes.indexOf(link.target.id);
        graph[sourceIndex].push(targetIndex);
        //graph[targetIndex].push(sourceIndex); // all links considered as reversible (like an undirected graph)
    });
    return graph;
}


export function JohnsonAlgorithm(graph: number[][], list_nodes:string[],flag: "Single" | "All"="All"): {[key:string]:string[]} {
    const nVertices: number = graph.length;
    let nbcycle:number=0;
    let start: number = 0;
    let Ak:  number[][] = graph;
    let B: number[][] = [];
    let blocked: boolean[] = [];
    for (let i = 0; i < nVertices; i++) {
        B.push(Array(nVertices).fill(0));
        blocked[i] = false;
    }
    let stack: (number | null)[] = [];
    for (let i = 0; i < nVertices; i++) {
        stack.push(null);
    }
    let stackTop: number = 0;
    const nbNodeToRun: number = (flag === "Single") ? 1 : nVertices;
    let result: {[key:string]:string[]} ={};

    function unblock(u: number): void {
        blocked[u] = false;
        for (let wPos = 0; wPos < B[u].length; wPos++) {
            let w: number = B[u][wPos];
            wPos -= removeFromList(B[u], w);
            if (blocked[w]) {
                unblock(w);
            }
        }
    }

    function circuit(v: number): boolean {
        let f: boolean = false;
        stackPush(v);
        blocked[v] = true;

        for (let wPos = 0; wPos < Ak[v].length; wPos++) {
            let w: number = Ak[v][wPos];
            if (w < start) {
                continue;
            }
            if (w === start) {
                let cycle: number[] = stack.slice(0, stackTop);
                if (cycle.length > 3) {
                    const cycleID:string[]=[];
                    stack.slice(0, stackTop).forEach(nodeIndex=>{
                        cycleID.push(list_nodes[nodeIndex]);
                    });
                    //adding check that not already found in the case of undirected cycle
                    let isDuplicate =  Object.values(result).some(existingCycle => arePermutations(existingCycle, cycleID));
                    if (!isDuplicate) {
                        result["cycle_"+String(nbcycle)]=cycleID;
                        nbcycle+=1;
                    }
                }
                f = true;
            } else if (!blocked[w]) {
                if (circuit(w)) {
                    f = true;
                }
            }
        }

        if (f) {
            unblock(v);
        } else {
            for (let wPos = 0; wPos < Ak[v].length; wPos++) {
                let w: number = Ak[v][wPos];
                if (w < start) {
                    continue;
                }
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
        stack[stackTop++] = val;
    }

    function stackPop(): number | null {
        return stack[--stackTop];
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