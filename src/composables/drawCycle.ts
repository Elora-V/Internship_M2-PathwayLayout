import { SubgraphNetwork } from "@/types/SubgraphNetwork";


export function drawAllCycles(subgraphNetwork:SubgraphNetwork):void {
    Object.keys(subgraphNetwork.cycles).forEach(cycleID=> {
        drawCycle(subgraphNetwork,cycleID);
    });
}

function drawCycle(subgraphNetwork:SubgraphNetwork,cycleToDraw:string|string[],direction :"clockwise"| "counter-clockwise"="clockwise",radius:number|undefined=undefined,radiusFactor:number=15):void {
    
    let cycle:string[]=[];
    if (typeof cycleToDraw == 'string' && cycleToDraw in subgraphNetwork.cycles){
        cycle=subgraphNetwork.cycles[cycleToDraw].nodes;
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
        var centroidX = 0;
        var centroidY = 0;

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

        if (radius === undefined){
            radius = cycle.length*radiusFactor;
        }

        // var shiftedNodesList = [].concat(nodesList);
        // shiftedNodesList = shiftedNodesList.concat(shiftedNodesList.splice(0, topIndex));
        // shiftedNodesList = (direction === "counter-clockwise") ? shiftedNodesList.concat(shiftedNodesList.splice(0, 1)) : shiftedNodesList;
        // var revNodesList = (direction === "counter-clockwise") ? [].concat(shiftedNodesList).reverse() : shiftedNodesList;

        // Shift cycle 
        const topIndex = 0; // first node of list is the top (to change if needed)
        const cycleCopy= cycle.slice();
        const shiftedCycle = cycleCopy.splice(topIndex).concat(cycleCopy);
        if(direction ==="counter-clockwise"){ 
            shiftedCycle.reverse();
        }

        for(let i=0; i<cycle.length; i++){
            const nodeI = network.nodes[shiftedCycle[i]];
            //var transform = revNodesList[i].attr("transform");
            //var transformList = transform.split(/(translate\([\d.,\-\s]*\))/);
            const x = centroidX + radius * Math.cos(2 * Math.PI * i / cycle.length);
            const y = centroidY + radius * Math.sin(2 * Math.PI * i / cycle.length);
            //var translate = "translate(" + x + "," + y + ")";
            //revNodesList[i].attr("transform", transformList[0] + translate + transformList[2]);
            nodeI.x = x;
            nodeI.y = y; 
        }
    }else{      
        console.error("cycle nodes not in network");
    }

}
