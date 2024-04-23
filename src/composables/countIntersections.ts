import { Node } from '@metabohub/viz-core/src/types/Node';
import { Network } from "@metabohub/viz-core/src/types/Network";
import { checkIntersection } from 'line-intersect';

export function countIntersection(network: Network): number {
    let nb: number = 0;
    for (let i=0 ; i<network.links.length ; i++) {
        let x1: Node = network.links[i].source;
        let x2: Node = network.links[i].target;
        for (let j=i+1 ; j<network.links.length ; j++) {
            let x3: Node = network.links[j].source;
            let x4: Node = network.links[j].target;
            const result = checkIntersection(x1.x, x1.y, x2.x, x2.y, x3.x, x3.y, x4.x, x4.y);
            if (result.type == "intersecting") {
                // check that intersection point is not the node itself
                if (!(x1.x == result.point.x && x1.y == result.point.y) 
                    && !(x2.x == result.point.x && x2.y == result.point.y)
                    && !(x3.x == result.point.x && x3.y == result.point.y)
                    && !(x4.x == result.point.x && x4.y == result.point.y)) {
                        nb++;
                    }
            }
        }
    }
    return nb;
}
