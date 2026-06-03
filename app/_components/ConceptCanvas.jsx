"use client";
import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

const difficultyColors = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

function ConceptNode({ data }) {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 shadow-lg cursor-pointer hover:shadow-xl transition-shadow bg-white dark:bg-gray-800"
      style={{ borderColor: difficultyColors[data.difficulty] || "#6b7280" }}
    >
      <div className="font-medium text-sm dark:text-white">{data.label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.domain}</div>
      <div
        className="text-xs mt-1 font-medium"
        style={{ color: difficultyColors[data.difficulty] || "#6b7280" }}
      >
        {data.difficulty}
      </div>
      {data.expandable && (
        <div className="text-xs text-primary mt-2 font-medium">Double-click to expand</div>
      )}
    </div>
  );
}

const nodeTypes = { conceptNode: ConceptNode };

export default function ConceptCanvas({ courseId, course }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);

  // Build initial graph from course chapters
  useEffect(() => {
    if (!course?.courseOutput?.course?.chapters) return;

    const chapters = course.courseOutput.course.chapters;
    const initialNodes = chapters.map((ch, i) => ({
      id: `chapter-${i}`,
      type: "conceptNode",
      position: { x: (i % 3) * 250, y: Math.floor(i / 3) * 150 },
      data: {
        label: ch.name,
        domain: course.category,
        difficulty: "intermediate",
        expandable: true,
        chapterIndex: i,
      },
    }));

    // Create edges based on chapter order (sequential prerequisites)
    const initialEdges = chapters.slice(1).map((_, i) => ({
      id: `edge-${i}-${i + 1}`,
      source: `chapter-${i}`,
      target: `chapter-${i + 1}`,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
      label: "builds on",
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
    setLoading(false);
  }, [course, setNodes, setEdges]);

  const onNodeDoubleClick = useCallback(
    async (event, node) => {
      if (expanding) return;
      setExpanding(node.id);

      try {
        const response = await fetch(`/api/canvas/${courseId}/expand`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conceptName: node.data.label,
            chapterIndex: node.data.chapterIndex,
          }),
        });

        const data = await response.json();
        if (data.concepts) {
          // Add new nodes
          const newNodes = data.concepts.map((c, i) => ({
            id: `expanded-${node.id}-${i}`,
            type: "conceptNode",
            position: {
              x: node.position.x + 250 + i * 50,
              y: node.position.y + (i % 2 === 0 ? -100 : 100),
            },
            data: {
              label: c.name,
              domain: c.domain || course.category,
              difficulty: c.difficulty || "intermediate",
              expandable: false,
            },
          }));

          // Add edges from parent
          const newEdges = data.concepts.map((c, i) => ({
            id: `edge-${node.id}-expanded-${i}`,
            source: node.id,
            target: `expanded-${node.id}-${i}`,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed },
            label: c.relationship || "contains",
          }));

          setNodes((nds) => [...nds, ...newNodes]);
          setEdges((eds) => [...eds, ...newEdges]);
        }
      } catch (error) {
        console.error("Failed to expand concept:", error);
      } finally {
        setExpanding(null);
      }
    },
    [courseId, course, expanding, setNodes, setEdges]
  );

  if (loading) {
    return (
      <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-gray-500">Building concept map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
      {expanding && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-white text-xs px-2 py-1 rounded">
          Expanding...
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
