import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

// ── Type-specific node dimensions ────────────────────────────
// These must match the actual CSS dimensions of each component
// so Dagre's collision math is based on the real footprint.
const NODE_DIMS: Record<string, { width: number; height: number }> = {
    rootNode: { width: 200, height: 200 },
    journeyNode: { width: 320, height: 180 },
    classificationNode: { width: 400, height: 520 }, // 3 inputs + button
    stageNode: { width: 224, height: 64 },
};

const FALLBACK_DIMS = { width: 320, height: 180 };

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // LR = root on LEFT, journeys / classification cards branch RIGHT
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 280 });

    nodes.forEach((node) => {
        // Use the real dimensions for each type — prevents overlap AND
        // stops the massive zoom-out caused by 520px-tall root slots.
        const dims = NODE_DIMS[node.type ?? ''] ?? FALLBACK_DIMS;
        dagreGraph.setNode(node.id, { width: dims.width, height: dims.height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const pos = dagreGraph.node(node.id);
        const dims = NODE_DIMS[node.type ?? ''] ?? FALLBACK_DIMS;
        return {
            ...node,
            // Required so React Flow's built-in renderers (smoothstep)
            // route paths Left→Right correctly
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: {
                x: pos.x - dims.width / 2,
                y: pos.y - dims.height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};
