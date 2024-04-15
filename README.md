# Pathway Layout for MetExplore3

## Sommaire

- [Library used](#lib)
- [Functions](#functions)
  - [`importNetwork`](#importNetwork)
  - [`readJson`](#readJson)
  - [`networkToGraph`](#networkToGraph)
  - [`graphToNetwork`](#graphToNetwork)
  - [`removeSideCompounds`](#removeSideCompounds)
  - [`duplicateReversibleReactions`](#duplicateReversibleReactions)
  - [`useLayout`](#useLayout)



## <a id="lib">Library used</a>

To apply the Sugiyama layout, two libraries were used (to keep the best result) : Dagre (https://github.com/dagrejs/dagre) and Viz (https://github.com/mdaines/viz-js).

To use graph algorithms, the library graph-data-structure (https://www.npmjs.com/package/graph-data-structure) is imported.

## <a id="functions">Functions</a>

The functions are implemented in the `src/composables` directory.

### <a id="importNetwork">`importNetwork.ts`</a>


There is no change compared to the functions of import from MetExplore.
Allow to import a file and call `readJsonGraph` to put the file informations into a network object.

Contains : 

- `importNetworkFromURL`

- `importNetworkFromFile`

- `loadNetwork`

- `getContentFromURL`


### <a id="readJson">`readJson.ts`</a>

...

### <a id="networkToGraph">`networkToGraph.ts`</a>

Allow convertion of the network to a format for the libraries.

Contains : 

- `NetworkToDagre` : for the Dagre library, require a network object and graph attributes can be added. The attributs are arguments for the layout algotithm to apply on the returned object (a dagre graph).

- `NetworkToViz`: for the Viz library, require a network object and graph attributes can be added. The attributs are arguments for the layout algotithm to apply on the returned object (a graph).

- `NetworkToSerialized`: for the graph-data-structure library, require a network object and return a Serialized object.

### <a id="graphToNetwork">`graphToNetwork.ts`</a>

Allow to change or create a network object.

Contains :

- `changeNetworkFromDagre` : Take dagre.graphlib.Graph object and the network associated (with the graph) : change the position and metadata (rank and order) of network's node by the one of the graph. The graph and network need to have the same nodes ! The function is asynchrone. The rank and order are in the dagre graph.

-`changeNetworkFromViz` : Take a json of a viz graph (type JsonViz implemented in `src/types`) and the network associated (with the json) : change the position and metadata (rank and order) of network's node by the one of the json. The graph and network need to have the same nodes ! The function is asynchrone. The rank and orderneed to be infered with the coordinates (cf `assignRankOrder`).

-`dagreToNetwork` : Take a dagre.graphlib.Graph object and return a Network object containing the same nodes and edge

-`assignRankOrder` : Take a network and all the unique y coordinate of the nodes. Add the rank (y position : first, second...; not coordinate) and order ( x position in the rank: first, second,....) to metadata of network. The vector of unique y is required to avoid a loop in the function. This information is obtained in the general loop of `changeNetworkFromViz`. This reduce modularity but improve the optimization. 


### <a id="removeSideCompounds">`removeSideCompounds.ts`</a>

Allow to remove side compounds from a graph. 

-`removeSideCompounds` : Remove side compounds of a network, the list of side compounds is predefined. The argurments are the network and the path to the file containning the list of side compounds.

### <a id="duplicateReversibleReactions">`duplicateReversibleReactions.ts`</a>

Allow to duplicate all the reversible reaction of a network.

-`duplicateReversibleReactions` :  Take a network and add a duplicated node of reversible reactions, and add links to this reaction. The links added are the same that for the original reaction, but source and target are inverted. A reaction node need the class "reaction" and "reversible" to be considered a reversible reaction.


- `reversibleNodeReaction` : Take a node and return a new node with same id and label but with a "_rev" added at the end. It is  the node of the reversible reaction, this function is called by `duplicateReversibleReactions`. 


### <a id="useLayout">`useLayout.ts`</a>


Apply a layout on the network.

- `dagreLayout` : Take a network object and change the (x,y) position of the node with dagre lib. It use `NetworkToDagre`and `changeNetworkFromDagre`to pass by a format accepted by the dagre library.

- `vizLayout` : Take a network object and change the (x,y) position of the node with viz lib. It use `NetworkToViz`and `changeNetworkFromViz`to pass by a format accepted by the dagre library.

Those functions call a callbackfunction that rescale the graph after applying the layout. 




