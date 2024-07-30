// ______________________________________________________________________________
// ----------------------------------------------- Style

export function changeNodeStyles(networkStyle:GraphStyleProperties):void{
	networkStyle.nodeStyles = {
		metabolite: {
			width: 25,
			height: 25,
			fill:  '#FFFFFF',
			shape: 'circle'
		},
    sideCompound: {
			width: 12,
			height: 12,
			fill:  '#f0e3e0',
			shape: 'circle'
		},
		reaction: {
			width: 15,
			height: 15,
			fill: "grey",
			shape: 'rect'
		},
		// reversible : {
		// 	fill : "green",
		// 	shape:"inverseTriangle"
		// },
		// reversibleVersion:{
		// 	fill:"red",
		// 	shape: "triangle"
		// }

	}

}