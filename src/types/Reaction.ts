
export enum MetaboliteType {
    REACTANT='reactif',
    PRODUCT='product',
}

export enum MinMedianMax {
    MEDIAN='median',
    MIN='min',
    MAX='max'
}

export interface Reaction {
    id:string
    reactantSideCompounds: Array<string>
    productSideCompounds:Array<string>
    angleMetabolites:{[key:string]:{angle:number,type:MetaboliteType}}
    medianMinMaxLengthLink?:{median:number,min:number,max:number}
    sideCompoundIntervals?: ReactionInterval[]
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