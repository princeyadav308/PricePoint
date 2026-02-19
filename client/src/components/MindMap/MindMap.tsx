import ReactFlow, { Background } from 'reactflow';
import 'reactflow/dist/style.css';

import { useMindMapStore } from '../../store/useMindMapStore';

import { RootNode } from './nodes/RootNode';
import { JourneyNode } from './nodes/JourneyNode';
import { StageNode } from './nodes/StageNode';
import { QuestionNode } from './nodes/QuestionNode';
import { AnimatedEdge } from './edges/AnimatedEdge';

const nodeTypes = {
    rootNode: RootNode,
    journeyNode: JourneyNode,
    stageNode: StageNode,
    classificationNode: QuestionNode,   // Product Classification card
};

const edgeTypes = {
    animatedEdge: AnimatedEdge,
};

export const MindMap = () => {
    const { nodes, edges, onNodesChange, onEdgesChange } = useMindMapStore();

    // Only render edges whose target node exists and is visible
    const safeEdges = edges.filter((edge) => {
        const target = nodes.find((n) => n.id === edge.target);
        return target && !target.hidden;
    });

    return (
        <div className="w-full h-screen">
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
                panOnDrag={true}
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
        </div>
    );
};
