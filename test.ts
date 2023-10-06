/**
 * Force directed graph layout algorithm according to Fruchterman and Reingold's principle. 
 * The algorithm can be summarized as follows: 
 * algorithm SPRING(G:graph);
 * place vertices of G in random locations;
 * repeat N times
 *     calculate the force on each vertex;
 *     move the vertex c4
 * draw graph on canvas, plotter or any drawing tool.
 * 
 * Source: http://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
 */

interface Vector2D {
    x: number
    y: number
    length: number
    assign: (v: Vector2D) => Vector2D
    Plus: (v: Vector2D) => Vector2D
    Min: (v: Vector2D) => Vector2D
    divide: (n: number) => Vector2D
    times: (n: number) => Vector2D

}

// Vector two hold the x and y position of a Node
let Vector2D = (x: number, y: number): Vector2D => ({
    x: x,
    y: y,
    length: Math.sqrt(x ** 2 + y ** 2), //Calculate the length of a Vector
    Min: function (v: Vector2D): Vector2D {
        return Vector2D(this.x - v.x, this.y - v.y)
    },
    Plus: function (v: Vector2D): Vector2D {
        return Vector2D(this.x + v.x, this.y + v.y)
    },
    assign: function (v: Vector2D): Vector2D {
        return v
    },
    divide: function (n: number): Vector2D {
        return Vector2D(this.x / n, this.y / n)
    },
    times: function (n: number): Vector2D {
        return Vector2D(this.x * n, this.y * n)
    }
})

// The AdjacencyMatrix is represented as a 2D Array of numbers(-1, 1, 1)
// 1 is to indicate that there is an Edge between two nodes
// 0 means no Edge 
// -1 Means there is an Edge in the opposite direction
type AdjacencyMatrix = (-1 | 0 | 1)[][]

type GraphLayout = Vector2D[]


type Edge = {
    from: number
    to: number
}

// Get a list of Edges from the matrix, the indexes of the nodes are stored in to and from
let getEdges = (G: AdjacencyMatrix): Edge[] => {
    return G.flatMap((row, rowIndex) => {
        return row.reduce((xs, x, columnIndex) => {
            if (x == 1) {
                return xs.concat({ from: rowIndex, to: columnIndex })
            }
            return xs
        }, Array<Edge>())
    })
}

// You can tweak the algorithm by changing the edge length or the number of iterations
let forceDirectedGraph = (G: AdjacencyMatrix, W = 1000, H = 1000, iterations = 50, edge_length?: number): GraphLayout => {
    let area = W * H
    let edges = getEdges(G)
    let k = edge_length == undefined ? Math.sqrt(area / G.length) : edge_length //maximum distance of the nodes
    let fa = (x: number): number => x ** 2 / k // Formula to calculate attractive forces
    let fr = (x: number): number => k ** 2 / x // Formula to calculate repulsive forces

    // give all nodes an initial position
    let positions = G.map(_ => Vector2D(Math.ceil(Math.random() * W), Math.ceil(Math.random() * H)))
    let displacements = G.map(_ => Vector2D(0, 0))

    let t = W / 10
    let dt = t / (iterations + 1)

    console.log(`area: ${area}`)
    console.log(`k: ${k}`)
    console.log(`t: ${t}, dt: ${dt}`)

    for (let i = 1; i <= iterations; i++) {
        console.log(`Iteration: ${i}`)

        // Calculate repulsive forces
        G.forEach((v, indexV) => {
            displacements[indexV] = Vector2D(0, 0)
            G.forEach((u, indexU) => {
                if (indexU != indexV) {
                    let delta = positions[indexV].Min(positions[indexU])
                    if (delta.length != 0) {
                        displacements[indexV] = displacements[indexV].Plus(delta.divide(delta.length).times(fr(delta.length)))
                    }

                }
            })
        })

        // Calculate attractive forces
        edges.forEach(edge => {
            let delta = positions[edge.to].Min(positions[edge.from])
            if (delta.length != 0) {
                displacements[edge.to] = displacements[edge.to].Min(delta.divide(delta.length).times(fa(delta.length)))
                displacements[edge.from] = displacements[edge.from].Plus(delta.divide(delta.length).times(fa(delta.length)))
            }
        })

        // limit max displacement
        G.forEach((node, index) => {
            positions[index] = positions[index].Plus(displacements[index].divide(displacements[index].length).times(Math.min(displacements.length, t)))
            positions[index].x = Math.min(W / 2, Math.max(-W / 2, positions[index].x))
            positions[index].y = Math.min(H / 2, Math.max(-H / 2, positions[index].y))
        })

        // reduce the temperature as the layout approaches a better conﬁguration
        t -= dt
    }

    console.log('Done...')

    return positions//.map(vector => vector.Plus(Vector2D(200, 200))) // When graph out of screen you can manually map the positions

}


let graph: AdjacencyMatrix = [
    [0, 1, 1, 0, 0],
    [-1, 0, 0, 1, 0],
    [-1, 0, 0, 1, 1],
    [0, -1, -1, 0, 0],
    [0, 0, -1, 0, 0],
]



let layout = forceDirectedGraph(graph)
console.log(layout)