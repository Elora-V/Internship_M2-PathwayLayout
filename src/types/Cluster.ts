type Rank = "same" | "source" | "min" | "sink" | "max" | "";

export class Cluster {
    name?: string;
    rank?: Rank; 
    classes?:Array<string>;
    nodes?: { [key: string]: NodeViz }; 
    Subcluster?: Cluster[];

    constructor(name:string,rank:Rank="",nodes:{ [key: string]: NodeViz }={},Subcluster:Cluster[]=[],classes:Array<string>=[]) {
        if (!name.startsWith("cluster_")) {
            name = "cluster_" + name;
        }
        this.name = name;
        this.rank = rank;
        this.nodes = nodes;
        this.Subcluster = Subcluster;
    }

    addNode(node: NodeViz): Cluster {
        this.nodes[node.name] = node;
        return this;
    }

    addRank(rank: Rank): Cluster {
        this.rank = rank;
        return this;
    }

    addSubcluster(Subcluster:Cluster):Cluster{
        this.Subcluster.push(Subcluster);
        return this;
    }

    addClass(newClass: string): Cluster {
        if (this.classes && !this.classes.includes(newClass)) {
            this.classes.push(newClass);
        }
        return this;
    }

    removeSubcluster(index: number): Cluster {
        if (this.Subcluster && index >= 0 && index < this.Subcluster.length) {
            this.Subcluster.splice(index, 1);
        }
        return this;
    }

    removeNode(name: string): Cluster {
        if (this.nodes && this.nodes[name]) {
            delete this.nodes[name];
        }
        return this;
    }

    removeClass(className: string): Cluster {
        if (this.classes) {
            const index = this.classes.indexOf(className);
            if (index !== -1) {
                this.classes.splice(index, 1);
            }
        }

        return this;
    }
}

