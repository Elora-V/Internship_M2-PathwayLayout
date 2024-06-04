import { SubgraphNetwork } from "@/types/SubgraphNetwork";


export function drawAllCycles(subgraphNetwork:SubgraphNetwork):void {
    Object.keys(subgraphNetwork.cycles).forEach(cycleID=> {
        drawCycle(subgraphNetwork,cycleID);
    });
}

function drawCycle(subgraphNetwork:SubgraphNetwork,cycleToDraw:string|string[],direction :"clockwise"| "counter-clockwise"="clockwise",radius:number|undefined=undefined,radiusFactor:number=15):void {
    
    let cycle:string[]=[];

    let centroidX :number;
    let centroidY :number;

    if (typeof cycleToDraw == 'string' && cycleToDraw in subgraphNetwork.cycles){
        cycle=subgraphNetwork.cycles[cycleToDraw].nodes;
        if (subgraphNetwork.cycles[cycleToDraw].metadata && subgraphNetwork.cycles[cycleToDraw].metadata["x"] && subgraphNetwork.cycles[cycleToDraw].metadata["y"]){
            centroidX=subgraphNetwork.cycles[cycleToDraw].metadata["x"] as number;
            centroidY=subgraphNetwork.cycles[cycleToDraw].metadata["y"] as number; 
        }
    }else if (Array.isArray(cycleToDraw)){
        cycle=cycleToDraw;
    }else{  
        console.log('argument cycleToDraw invalid');
    }

    // Check if the node are present in the graph
    const network = subgraphNetwork.network.value;
    let cycleExist = true;
    cycle.forEach(node=>{
        if (!(node in network.nodes)){
            cycleExist=false;
        }
    });

    if (cycleExist && cycle.length>0){
    
        // Determine whether the points are arranged in a mostly clockwise or counter-clockwise fashion (cf shoelace formula)
        // var directionTotal = 0;
        // var topValue = 0;
        // var topIndex = 0;
        // for (var i=0; i<cycle.length; i++){
        //     var nextI = (i + 1 < cycle.length) ? i + 1 : 0;
        //     var x1 = 0;
        //     var x2 = 0;
        //     var y1 = 0;
        //     var y2 = 0;
        //     nodesList[i].each(function (d) {
        //         x1 = d.x;
        //         y1 = d.y;
        //     });
        //     nodesList[nextI].each(function (d) {
        //         x2 = d.x;
        //         y2 = d.y;
        //     });
        //     if (x1 > topValue) {
        //         topValue = x1;
        //         topIndex = i;
        //     }
        //     directionTotal += (x2 - x1) * (y2 + y1);
        // }
        // var direction = (directionTotal < 0) ? "clockwise" : "counter-clockwise";

        // Compute the centroid of the points that are part of the cycle
        
        if (centroidX ==undefined && centroidY ==undefined){
            cycle.forEach(node=> {
                if (!("x" in network.nodes[node])){
                    network.nodes[node].x=0;
                }
                if (!("y" in network.nodes[node])){
                    network.nodes[node].y=0;
                }
                centroidX += network.nodes[node].x;
                centroidY += network.nodes[node].y;
            });
            
            centroidX = centroidX / cycle.length;
            centroidY = centroidY / cycle.length;
        }

        if (radius === undefined){
            radius = cycle.length*radiusFactor;
        }

        // var shiftedNodesList = [].concat(nodesList);
        // shiftedNodesList = shiftedNodesList.concat(shiftedNodesList.splice(0, topIndex));
        // shiftedNodesList = (direction === "counter-clockwise") ? shiftedNodesList.concat(shiftedNodesList.splice(0, 1)) : shiftedNodesList;
        // var revNodesList = (direction === "counter-clockwise") ? [].concat(shiftedNodesList).reverse() : shiftedNodesList;

        // Shift cycle 
        const topIndex = findTopCycleNode(subgraphNetwork,cycle); // first node of list is the top 

        const cycleCopy= cycle.slice();
        const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);
        if(direction ==="counter-clockwise"){ 
            shiftedCycle.reverse();
        }

        console.log(shiftedCycle);

        for(let i=0; i<cycle.length; i++){
            const nodeI = network.nodes[shiftedCycle[i]];
            //var transform = revNodesList[i].attr("transform");
            //var transformList = transform.split(/(translate\([\d.,\-\s]*\))/);
            const x = centroidX + radius * Math.cos(2 * Math.PI * i / cycle.length - Math.PI/2); // original : 2 * Math.PI * i / cycle.length
            // I shift by pi/2 so that the begining of cycle is up
            const y = centroidY + radius * Math.sin(2 * Math.PI * i / cycle.length - Math.PI/2);
            //var translate = "translate(" + x + "," + y + ")";
            //revNodesList[i].attr("transform", transformList[0] + translate + transformList[2]);
            nodeI.x = x;
            nodeI.y = y; 
        }
    }else{      
        console.error("cycle nodes not in network");
    }

}


function findTopCycleNode(subgraphNetwork: SubgraphNetwork, cycleNodes:string[]):number{

    let minY:number=Infinity; // min Y as y-axis as in matrix, not as usual (infinity at the bottom, -inf at the top)
    let cycleNodeLinkedMinY:number=0; // node, in cycle, linked with the highest node (min y)
    const network=subgraphNetwork.network.value;

    for(let i=0;i<cycleNodes.length;i++){

        const node=cycleNodes[i];
        // get neighbors of node that aren't in the cycle
        const nodeNeighbors = network.links
            .filter(link => link.source.id === node || link.target.id === node) // get link linked with node
            .map(link => link.source.id === node ? link.target.id : link.source.id) // get the other node 
            .filter(id => !cycleNodes.includes(id)); // no node from this cycle
            

        nodeNeighbors.forEach(neighbor=>{
            if(network.nodes[neighbor] && network.nodes[neighbor].y){
                if(network.nodes[neighbor].y<minY){
                    minY=network.nodes[neighbor].y;
                    cycleNodeLinkedMinY=i;
                }
            }
        });
    }
    
    return cycleNodeLinkedMinY;
}