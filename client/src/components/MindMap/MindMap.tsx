import { useEffect, useRef, useMemo } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { useMindMapStore } from '../../store/useMindMapStore';
import { useSessionStore } from '../../store/useSessionStore';
import type { SessionStage } from '../../types/session';

import { RootNode } from './nodes/RootNode';
import { JourneyNode } from './nodes/JourneyNode';
import { StageNode } from './nodes/StageNode';
import { QuestionNode } from './nodes/QuestionNode';
import { ResultNode } from './nodes/ResultNode';
import { AnimatedEdge } from './edges/AnimatedEdge';

const nodeTypes = {
    rootNode: RootNode,
    journeyNode: JourneyNode,
    stageNode: StageNode,
    classificationNode: QuestionNode,
    resultNode: ResultNode,
};

const edgeTypes = {
    animatedEdge: AnimatedEdge,
};

// ── Branch IDs for convergence trigger ───────────────────────
const REQUIRED_BRANCHES: SessionStage[] = ['market_research', 'product_value', 'financials'];

// ── Inner component — has access to useReactFlow ─────────────
const MindMapInner = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, lastAddedNodeId, spawnConvergence } = useMindMapStore();
    const completedStages = useSessionStore((s) => s.completedStages);
    const { fitView } = useReactFlow();
    const prevNodeIdRef = useRef<string | null>(null);

    // Only render edges whose target node exists and is visible
    const safeEdges = edges.filter((edge) => {
        const target = nodes.find((n) => n.id === edge.target);
        return target && !target.hidden;
    });

    // ── Auto-pan camera when a new node is added ─────────────
    useEffect(() => {
        if (lastAddedNodeId && lastAddedNodeId !== prevNodeIdRef.current) {
            prevNodeIdRef.current = lastAddedNodeId;
            const timer = setTimeout(() => {
                fitView({
                    nodes: [{ id: lastAddedNodeId }],
                    duration: 800,
                    padding: 0.4,
                    maxZoom: 0.8,
                });
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [lastAddedNodeId, fitView]);

    // ── Master Lock: auto-spawn VW when all 3 branches complete ─
    const allBranchesComplete = useMemo(() =>
        REQUIRED_BRANCHES.every((id) => completedStages.includes(id)),
        [completedStages]
    );
    const convergenceExists = nodes.some((n) => n.id === 'stage-van_westendorp');

    // Auto-spawn convergence node when all branches are done
    useEffect(() => {
        if (allBranchesComplete && !convergenceExists) {
            spawnConvergence();
            setTimeout(() => {
                fitView({
                    nodes: [{ id: 'stage-van_westendorp' }],
                    duration: 800,
                    padding: 0.4,
                    maxZoom: 0.8,
                });
            }, 300);
        }
    }, [allBranchesComplete, convergenceExists, spawnConvergence, fitView]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={safeEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.4, maxZoom: 0.7 }}
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{ type: 'animatedEdge' }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={[1]}
            panOnScroll={true}
            zoomOnScroll={true}
            className="!bg-background-light dark:!bg-background-dark"
            onInit={(instance) => {
                setTimeout(() => {
                    instance.fitView({
                        nodes: [{ id: 'root' }, { id: 'journey-a' }, { id: 'journey-b' }],
                        padding: 0.4,
                        maxZoom: 0.7,
                        duration: 600,
                    });
                }, 100);
            }}
        >
            <Background color="#CBD5E1" gap={24} size={1} />
        </ReactFlow>
    );
};

// ── Outer wrapper — provides ReactFlowProvider implicitly ────
export const MindMap = () => {
    return (
        <div className="w-full h-screen relative">
            <ReactFlowProvider>
                <MindMapInner />
            </ReactFlowProvider>
        </div>
    );
};
