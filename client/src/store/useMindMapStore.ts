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
import type { StageConfig } from '../data/questions.config';
import { getLayoutedElements } from '../utils/useAutoLayout';
import { STAGE_1_QUESTIONS, VAN_WESTENDORP_QUESTIONS } from '../data/questions.config';
import { useSessionStore } from './useSessionStore';
import { calculatePrice, PricingResult } from '../utils/pricingEngine';

// ============================================================
// Mind Map Store — Calculate-First Architecture
//
// CRITICAL RULE: Every node addition goes through Dagre re-layout
// EXCEPT convergence + result nodes which use Strict Coordinate
// Anchoring: X = max(X_branches) + 500, Y = centroid.
// ============================================================

interface MindMapState {
    nodes: Node[];
    edges: Edge[];
    selectedJourney: JourneyType | null;
    isExpanded: boolean;
    lastAddedNodeId: string | null;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    goToMap: (type: JourneyType) => void;
    expandJourney: (parentId: string) => void;
    submitStage: (parentNodeId: string, nextStageConfig: StageConfig) => void;
    spawnBranches: (parentNodeId: string, branchConfigs: StageConfig[]) => void;
    spawnConvergence: () => void;
    spawnResult: (parentNodeId: string) => void;
    resetMap: () => void;
}

// ── Initial 3 nodes ──────────────────────────────────────────
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

// ── Branch IDs for convergence detection ─────────────────────
const BRANCH_IDS = ['stage-market_research', 'stage-product_value', 'stage-financials'];

// ============================================================
// Store
// ============================================================
export const useMindMapStore = create<MindMapState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedJourney: null,
    isExpanded: false,
    lastAddedNodeId: null,

    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

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

    // ── expandJourney — spawns Product Classification (stage-1) ──
    expandJourney: (parentId: string) => {
        const { nodes, edges } = get();

        if (nodes.some((n) => n.id === 'stage-1')) return;

        const newNode: Node = {
            id: 'stage-1',
            type: 'classificationNode',
            position: { x: 0, y: 0 },
            data: { config: STAGE_1_QUESTIONS, label: 'Product Classification' },
        };

        const newEdge: Edge = {
            id: `e-${parentId}-stage-1`,
            source: parentId,
            sourceHandle: 'right',
            target: 'stage-1',
            targetHandle: 'left',
            type: 'animatedEdge',
            data: { color: 'navy' },
        };

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

        const allNodes = [...updatedNodes, newNode];
        const allEdges = [...updatedEdges, newEdge];
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);

        set({
            nodes: layoutedNodes,
            edges: layoutedEdges,
            selectedJourney: journeyType,
            isExpanded: true,
            lastAddedNodeId: 'stage-1',
        });
    },

    // ── submitStage — linear: spawns ONE next node ────────────
    submitStage: (parentNodeId: string, nextStageConfig: StageConfig) => {
        const { nodes, edges } = get();

        const newNodeId = `stage-${nextStageConfig.id}`;
        if (nodes.some((n) => n.id === newNodeId)) return;

        const newNode: Node = {
            id: newNodeId,
            type: 'classificationNode',
            position: { x: 0, y: 0 },
            data: { config: nextStageConfig, label: nextStageConfig.title },
        };

        const newEdge: Edge = {
            id: `e-${parentNodeId}-${newNodeId}`,
            source: parentNodeId,
            sourceHandle: 'right',
            target: newNodeId,
            targetHandle: 'left',
            type: 'animatedEdge',
            data: { color: 'navy' },
        };

        const allNodes = [...nodes, newNode];
        const allEdges = [...edges, newEdge];
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);

        set({
            nodes: layoutedNodes,
            edges: layoutedEdges,
            lastAddedNodeId: newNodeId,
        });
    },

    // ── spawnBranches — simultaneous: spawns N nodes ──────────
    spawnBranches: (parentNodeId: string, branchConfigs: StageConfig[]) => {
        const { nodes, edges } = get();

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        for (const config of branchConfigs) {
            const nodeId = `stage-${config.id}`;
            if (nodes.some((n) => n.id === nodeId)) continue;

            newNodes.push({
                id: nodeId,
                type: 'classificationNode',
                position: { x: 0, y: 0 },
                data: { config, label: config.title },
            });

            newEdges.push({
                id: `e-${parentNodeId}-${nodeId}`,
                source: parentNodeId,
                sourceHandle: 'right',
                target: nodeId,
                targetHandle: 'left',
                type: 'animatedEdge',
                data: { color: 'navy' },
            });
        }

        if (newNodes.length === 0) return;

        const allNodes = [...nodes, ...newNodes];
        const allEdges = [...edges, ...newEdges];
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, allEdges);

        set({
            nodes: layoutedNodes,
            edges: layoutedEdges,
            lastAddedNodeId: newNodes[0]?.id ?? null,
        });
    },

    // ── spawnConvergence — Strict Coordinate Anchoring ────────
    // X = max(X_branches) + 500, Y = centroid of 3 branches
    spawnConvergence: () => {
        const { nodes, edges } = get();

        if (nodes.some((n) => n.id === 'stage-van_westendorp')) return;

        const branchNodes = nodes.filter((n) => BRANCH_IDS.includes(n.id));
        if (branchNodes.length === 0) return;

        const maxX = Math.max(...branchNodes.map((n) => n.position.x + 400));
        const ys = branchNodes.map((n) => n.position.y);
        const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

        const convergenceNode: Node = {
            id: 'stage-van_westendorp',
            type: 'classificationNode',
            position: { x: maxX + 500, y: centerY },
            data: { config: VAN_WESTENDORP_QUESTIONS, label: 'Price Sensitivity' },
        };

        // Connect from all 3 branches with gold edges
        const newEdges: Edge[] = branchNodes.map((bn) => ({
            id: `e-${bn.id}-convergence`,
            source: bn.id,
            sourceHandle: 'right',
            target: 'stage-van_westendorp',
            targetHandle: 'left',
            type: 'animatedEdge',
            data: { color: 'gold' },
        }));

        set({
            nodes: [...nodes, convergenceNode],
            edges: [...edges, ...newEdges],
            lastAddedNodeId: 'stage-van_westendorp',
        });
    },

    // ── spawnResult — Trinity Quote (strict anchoring) ────────
    spawnResult: (parentNodeId: string) => {
        const { nodes, edges } = get();

        if (nodes.some((n) => n.id === 'result-trinity')) return;

        const parentNode = nodes.find((n) => n.id === parentNodeId);
        if (!parentNode) return;

        // Run pricing engine
        const sessionAnswers = useSessionStore.getState().answers;
        const result: PricingResult = calculatePrice(sessionAnswers);

        const resultNode: Node = {
            id: 'result-trinity',
            type: 'resultNode',
            position: {
                x: parentNode.position.x + 500,
                y: parentNode.position.y,
            },
            data: { result },
        };

        const newEdge: Edge = {
            id: `e-${parentNodeId}-result`,
            source: parentNodeId,
            sourceHandle: 'right',
            target: 'result-trinity',
            targetHandle: 'left',
            type: 'animatedEdge',
            data: { color: 'gold' },
        };

        set({
            nodes: [...nodes, resultNode],
            edges: [...edges, newEdge],
            lastAddedNodeId: 'result-trinity',
        });
    },

    resetMap: () =>
        set({
            nodes: initialNodes,
            edges: initialEdges,
            selectedJourney: null,
            isExpanded: false,
            lastAddedNodeId: null,
        }),
}));
