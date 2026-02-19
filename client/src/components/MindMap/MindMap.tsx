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

    // ── Master Lock: show FAB when all 3 branches complete ───
    const allBranchesComplete = useMemo(() =>
        REQUIRED_BRANCHES.every((id) => completedStages.includes(id)),
        [completedStages]
    );
    const convergenceExists = nodes.some((n) => n.id === 'stage-van_westendorp');
    const showFAB = allBranchesComplete && !convergenceExists;

    const handleConvergenceClick = () => {
        spawnConvergence();
        setTimeout(() => {
            fitView({
                nodes: [{ id: 'stage-van_westendorp' }],
                duration: 800,
                padding: 0.4,
                maxZoom: 0.8,
            });
        }, 300);
    };

    return (
        <>
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

            {/* ── Floating "Calculate Pricing Intelligence" CTA ── */}
            {showFAB && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
                    <button
                        onClick={handleConvergenceClick}
                        className="
                            px-8 py-4 rounded-full
                            bg-primary hover:bg-primary-dark
                            text-white font-bold text-base
                            outer-shadow-lg
                            transition-all duration-300
                            active:scale-95
                            flex items-center gap-3
                            animate-pulse-ring
                        "
                    >
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                            ✧
                        </span>
                        Calculate Pricing Intelligence
                    </button>
                </div>
            )}
        </>
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
