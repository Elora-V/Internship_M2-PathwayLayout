
/**
 * This file contains the types for the Reaction : use to apply side compound motif
 */

export enum MetaboliteType {
    REACTANT='reactant',
    PRODUCT='product',
}

// export enum MinMedianMax {
//     MEDIAN='median',
//     MIN='min',
//     MAX='max'
// }

export interface Reaction {
    id:string
    sideCompoundsReactants: Array<string>
    sideCompoundsProducts:Array<string>
    metabolitesAngles:{[key:string]:{angle:number,type:MetaboliteType}}
    linkMedianMinMaxLength?:{median:number,min:number,max:number}
    intervalsAvailables?: ReactionInterval[]
    angleSpacingReactant?:number
    angleSpacingProduct?:number
}

export interface ReactionInterval {
    typeInterval: number; 
    // 0 if reactant then product, 1 if product then reactant, 
    // but if the x-axis is between the two (special case) : it is 2 when reactant is the smaller angle, 3 when product is the smaller angle
    reactant: string;
    product: string;
}