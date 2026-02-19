import { create } from 'zustand';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import type { JourneyType } from '../types/session';
import { getLayoutedElements } from '../utils/useAutoLayout';
import { STAGE_1_QUESTIONS } from '../data/questions.config';

// ============================================================
// Mind Map Store — Calculate-First Architecture
// ============================================================

interface MindMapState {
    nodes: Node[];
    edges: Edge[];
    selectedJourney: JourneyType | null;
    isExpanded: boolean;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    goToMap: (type: JourneyType) => void;
    expandJourney: (parentId: string) => void;
    resetMap: () => void;
}

// ── Initial 3 nodes (positions set by getLayoutedElements) ───
const rawNodes: Node[] = [
    {
        id: 'root',
        type: 'rootNode',
        data: { label: 'PricePoint' },
        position: { x: 0, y: 0 },
        draggable: false,
    },
    {
        id: 'journey-a',
        type: 'journeyNode',
        data: {
            type: 'established',
            selected: false,
            label: 'Audit Existing Price',
            subtitle: 'Audit my current price & find lost margin.',
        },
        position: { x: 0, y: 0 },
    },
    {
        id: 'journey-b',
        type: 'journeyNode',
        data: {
            type: 'new',
            selected: false,
            label: 'Set Launch Price',
            subtitle: 'Build a data-backed price from scratch.',
        },
        position: { x: 0, y: 0 },
    },
];

const rawEdges: Edge[] = [
    {
        id: 'root-to-a',
        source: 'root',
        sourceHandle: 'right',
        target: 'journey-a',
        targetHandle: 'left',
        type: 'animatedEdge',
        data: { color: 'gold' },
    },
    {
        id: 'root-to-b',
        source: 'root',
        sourceHandle: 'right',
        target: 'journey-b',
        targetHandle: 'left',
        type: 'animatedEdge',
        data: { color: 'gold' },
    },
];

const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(rawNodes, rawEdges);

// ============================================================
// Store
// ============================================================
export const useMindMapStore = create<MindMapState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedJourney: null,
    isExpanded: false,

    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    // Navigate from LandingView → MindMap — only dim the unchosen card.
    // The chosen card stays in its default raised state until clicked inside the mind map.
    goToMap: (type: JourneyType) => {
        const dimmedId = type === 'established_seller' ? 'journey-b' : 'journey-a';

        const updatedNodes = get().nodes.map((node) => {
            if (node.id === dimmedId) {
                return {
                    ...node,
                    data: { ...node.data, selected: false, dimmed: true },
                    style: { opacity: 0.3, pointerEvents: 'none' as const, filter: 'grayscale(1)' },
                };
            }
            return node;
        });

        set({ isExpanded: true, nodes: updatedNodes, selectedJourney: type });
    },

    // expandJourney — called by JourneyNode inside the mind map
    expandJourney: (parentId: string) => {
        const { nodes, edges, isExpanded } = get();

        // Guard: prevent double-expansion
        if (isExpanded) return;

        const parentNode = nodes.find((n) => n.id === parentId);
        if (!parentNode) return;

        const newNodeId = 'stage-1';

        // CALCULATE FIRST: Anchor 600px right of the parent immediately
        // Precise offset ensures NO overlap with the journey card.
        // -100 on Y is a slight upward adjustment for visual balance.
        const startX = parentNode.position.x + 600;
        const startY = parentNode.position.y - 100;

        const newNode: Node = {
            id: newNodeId,
            type: 'classificationNode',
            position: { x: startX, y: startY },
            data: {
                config: STAGE_1_QUESTIONS,
                label: 'Product Classification',
                journey: parentNode.data.label,
            },
        };

        const newEdge: Edge = {
            id: `e-${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#002147', strokeWidth: 3 },
        };

        // Atomic update — no intermediate renders
        const dimmedId = parentId === 'journey-a' ? 'journey-b' : 'journey-a';
        const journeyType: JourneyType = parentId === 'journey-a' ? 'established_seller' : 'new_launcher';

        const updatedNodes = nodes.map((node) => {
            if (node.id === parentId) {
                return { ...node, data: { ...node.data, selected: true } };
            }
            if (node.id === dimmedId) {
                return {
                    ...node,
                    data: { ...node.data, selected: false, dimmed: true },
                    style: { ...node.style, opacity: 0.3, pointerEvents: 'none' as const },
                };
            }
            return node;
        });

        const updatedEdges = edges.map((edge) => {
            if (edge.source === 'root' && edge.target === parentId) {
                return { ...edge, data: { color: 'blue' } };
            }
            if (edge.source === 'root' && edge.target === dimmedId) {
                return { ...edge, style: { opacity: 0.2 } };
            }
            return edge;
        });

        set({
            nodes: [...updatedNodes, newNode],
            edges: [...updatedEdges, newEdge],
            selectedJourney: journeyType,
            isExpanded: true,
        });
    },

    resetMap: () =>
        set({
            nodes: initialNodes,
            edges: initialEdges,
            selectedJourney: null,
            isExpanded: false,
        }),
}));
