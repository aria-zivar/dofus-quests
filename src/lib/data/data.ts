import type { ElementsDefinition } from 'cytoscape'
import { get } from '../locale/localisation.svelte'
import dataRaw from './data.json'

export type Quest = {
    id: string
    type: 'quest'
    requirements: string
    categoryId: number
    achCatId: number
    levels: [number, number]
    noob?: string
}

export type Achievement = {
    id: string
    type: 'achievement'
    requirements: string
    categoryId: number
    dispCatId: number
    order: number
    level: number
    noob?: string
}

export type Almanax = {
    day: number
    month: number
    id: string
    itemId: number
    itemImg: string
    itemQuantity: number
}

export type Edge = {
    to: string
    from: string
    type:
        | 'FINISHED'
        | 'NOT_FINISHED'
        | 'IN_PROGRESS'
        | 'FINISHED_N_TIMES'
        | 'AVAILABLE'
}

export type Category = {
    id: number
    order: number
}

export type Data = {
    nodes: (Quest | Achievement)[]
    edges: Edge[]
    achievementCategories: Category[]
    questCategories: Category[]
    almanax: Almanax[]
    titles: number[]
}

export const data = dataRaw as Data

export type CytoData = {
    nodes: { data: { id: string; type: string } }[]
    edges: { data: { source: string; target: string; type: string } }[]
}

export const toCyto = (
    data: Pick<Data, 'nodes' | 'edges'>
): ElementsDefinition => ({
    nodes: data.nodes.map((n) => ({
        data: {
            id: n.id,
            type: n.type,
            name: get(n.id, 'name'),
            group: n.type === 'quest' ? n.achCatId : n.dispCatId,
        },
    })),
    edges: data.edges.map(({ from, to, type }) => ({
        id: `${from}-${to}`,
        data: { source: from, target: to, type: type },
    })),
})

export const onlyPredecessors = (data: Data, id: string): Data => {
    const predecessorNodes = new Set([id])
    let changed = true
    while (changed) {
        changed = false
        data.edges.forEach((edge) => {
            if (
                predecessorNodes.has(edge.to) &&
                !predecessorNodes.has(edge.from)
            ) {
                predecessorNodes.add(edge.from)
                changed = true
            }
        })
    }
    return {
        ...data,
        nodes: data.nodes.filter((node) => predecessorNodes.has(node.id)),
        edges: data.edges.filter(
            (edge) =>
                predecessorNodes.has(edge.from) && predecessorNodes.has(edge.to)
        ),
    }
}

export const id = (
    node: Quest | Achievement | (Edge & { _id?: string })
): string =>
    'id' in node
        ? node.id
        : (node._id ??= `${node.from}-${node.to}-${node.type}`)
