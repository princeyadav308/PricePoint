import { useEffect, useRef, useMemo, useCallback } from 'react';
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
const REQUIRED_BRANCHES: SessionStage[] = ['market_research', 'distribution', 'psychological'];

// ── Inner component — has access to useReactFlow ─────────────
const MindMapInner = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, lastAddedNodeId, spawnConvergence } = useMindMapStore();
    const completedStages = useSessionStore((s) => s.completedStages);
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const prevNodeIdRef = useRef<string | null>(null);

    // ── Zoom control handlers ────────────────────────────────
    const handleZoomIn = useCallback(() => {
        zoomIn({ duration: 300 });
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut({ duration: 300 });
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ padding: 0.05, maxZoom: 0.65, duration: 600 });
    }, [fitView]);

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
                    padding: 0.2,
                    maxZoom: 1.1,
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
                    padding: 0.2,
                    maxZoom: 1.1,
                });
            }, 300);
        }
    }, [allBranchesComplete, convergenceExists, spawnConvergence, fitView]);

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
                fitViewOptions={{ padding: 0.2, maxZoom: 1.0 }}
                minZoom={0.3}
                maxZoom={2.0}
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
                            padding: 0.2,
                            maxZoom: 1.0,
                            duration: 600,
                        });
                    }, 100);
                }}
            >
                <Background color="#CBD5E1" gap={24} size={1} />
            </ReactFlow>

            {/* ── Zoom/Pan Controls (bottom-right) ── */}
            <div className="absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-4 items-end">
                <div className="flex items-center bg-background-light dark:bg-background-dark rounded-xl outer-shadow p-1">
                    <button
                        onClick={handleZoomIn}
                        className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer"
                        title="Zoom In"
                    >
                        <span className="material-icons-round text-sm">add</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button
                        onClick={handleZoomOut}
                        className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer"
                        title="Zoom Out"
                    >
                        <span className="material-icons-round text-sm">remove</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button
                        onClick={handleFitView}
                        className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer"
                        title="Fit to View"
                    >
                        <span className="material-icons-round text-sm">center_focus_weak</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button
                        className="active-pressed w-10 h-10 flex items-center justify-center rounded-lg text-gray-800 dark:text-gray-200 cursor-pointer"
                        title="Pan Mode (Active)"
                    >
                        <span className="material-icons-round text-sm">pan_tool</span>
                    </button>
                </div>
            </div>
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
