import { Node } from '@metabohub/viz-core/src/types/Node';
import { Network } from "@metabohub/viz-core/src/types/Network";
import { checkIntersection } from 'line-intersect';
import { Link } from '@metabohub/viz-core/src/types/Link';

function isNodeCoord(node: Node, x: number, y: number): boolean {
    return (node.x == x && node.y == y);
}

function edgesIntersection(link1: Link, link2: Link): boolean {
    let x1: Node = link1.source;
    let x2: Node = link1.target;
    let x3: Node = link2.source;
    let x4: Node = link2.target;
    const result = checkIntersection(x1.x, x1.y, x2.x, x2.y, x3.x, x3.y, x4.x, x4.y);
    if (result.type == "intersecting") {
        // check that intersection point is not the node itself
        if (!isNodeCoord(x1, result.point.x, result.point.y) 
            && !isNodeCoord(x2, result.point.x, result.point.y) 
            && !isNodeCoord(x3, result.point.x, result.point.y) 
            && !isNodeCoord(x4, result.point.x, result.point.y) ) {
                return true
            }
    } else {
        return false;
    }
}

export function countIntersection(network: Network): number {
    let nb: number = 0;
    for (let i=0 ; i<network.links.length ; i++) {
        for (let j=i+1 ; j<network.links.length ; j++) {
            if (edgesIntersection(network.links[i], network.links[j])) {
                nb++;
            }
        }
    }
    return nb;
}
