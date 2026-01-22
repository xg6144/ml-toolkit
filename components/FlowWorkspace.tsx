import React, { useState, useRef, useEffect } from 'react';
import { StudentUser, Project, FlowNode, FlowEdge, NodeType, Dataset } from '../types';
import { simulateTraining } from '../services/geminiService';
import Button from './Button';
import Modal from './Modal';
import { APP_NAME } from '../constants';
import DatasetViewer from './DatasetViewer';

interface FlowWorkspaceProps {
  user: StudentUser;
  project: Project;
  onBack: () => void;
}

// Initial palette items
const PALETTE_ITEMS: {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  subItems?: {
    label: string;
    value: string;
    children?: { label: string; value: string }[]
  }[]
}[] = [
    {
      type: 'dataset',
      label: 'Dataset',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      color: 'bg-blue-100 border-blue-500 text-blue-700',
      subItems: [
        { label: 'Dataset Load', value: 'dataset_load' },
        { label: 'Column Drop', value: 'column_drop' },
        { label: 'Concatenate (Merge)', value: 'concatenate' },
        { label: 'Data Viewer', value: 'data_viewer' }
      ]
    },
    {
      type: 'preprocess',
      label: '데이터 전처리',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      color: 'bg-yellow-100 border-yellow-500 text-yellow-700',
      subItems: [
        {
          label: 'Tabular Processing',
          value: 'tabular',
          children: [
            { label: 'Normalization (0~1)', value: 'Normalization' },
            { label: 'Standardization', value: 'Standardization' },
            { label: 'One-Hot Encoding', value: 'OneHot' },
            { label: 'Handle Missing Values', value: 'Imputer' }
          ]
        },
        {
          label: 'Image Processing',
          value: 'image',
          children: [
            { label: 'Resize', value: 'Resize' },
            { label: 'Grayscale', value: 'Grayscale' },
            { label: 'Augmentation (Flip/Rot)', value: 'Augmentation' }
          ]
        }
      ]
    },
    {
      type: 'model',
      label: 'AI Model',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      color: 'bg-purple-100 border-purple-500 text-purple-700',
      subItems: [
        {
          label: 'Classification',
          value: 'classification',
          children: [
            { label: 'CNN', value: 'CNN' },
            { label: 'ResNet', value: 'ResNet' },
            { label: 'VGG', value: 'VGG' },
            { label: 'MobileNet', value: 'MobileNet' },
            { label: 'Random Forest', value: 'RandomForest' },
            { label: 'SVM', value: 'SVM' },
            { label: 'Decision Tree', value: 'DecisionTree' },
            { label: 'KNN', value: 'KNN' },
            { label: 'Logistic Regression', value: 'LogisticRegression' },
          ]
        },
        {
          label: 'Regression',
          value: 'regression',
          children: [
            { label: 'Linear Regression', value: 'Linear' },
            { label: 'LSTM', value: 'LSTM' },
            { label: 'GRU', value: 'GRU' },
            { label: 'Transformer', value: 'Transformer' },
            { label: 'Random Forest', value: 'RandomForestRegressor' },
            { label: 'SVR', value: 'SVR' },
            { label: 'Decision Tree', value: 'DecisionTreeRegressor' },
            { label: 'XGBoost', value: 'XGBoost' },
          ]
        }
      ]
    },
    { type: 'training', label: '학습 (Train)', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'bg-red-100 border-red-500 text-red-700' },
    { type: 'evaluation', label: '성능 평가', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-green-100 border-green-500 text-green-700' },
  ];

const FlowWorkspace: React.FC<FlowWorkspaceProps> = ({ user, project, onBack }) => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Connection State
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [connectionStartHandle, setConnectionStartHandle] = useState<'right' | 'bottom' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);

  // Modal State
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);

  // Canvas refs for dragging
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load saved data on mount
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const response = await fetch(`/api/project/${project.id}`);
        if (response.ok) {
          const projectData = await response.json();
          if (projectData.content) {
            try {
              const { nodes: savedNodes, edges: savedEdges, log } = JSON.parse(projectData.content);
              if (savedNodes) setNodes(savedNodes);
              if (savedEdges) setEdges(savedEdges);
              if (log) setSimulationLog(log);
            } catch (parseError) {
              console.error("Failed to parse project content", parseError);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load project", error);
      }
    };

    loadProjectData();
  }, [project.id]);

  // Load datasets
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/datasets?studentId=${user.id}`);
        const data = await res.json();
        setAvailableDatasets(data);
      } catch (e) {
        console.error("Failed to fetch datasets", e);
      }
    };
    fetchDatasets();
  }, [user.id]);

  // Save functionality
  const handleSave = async () => {
    const dataToSave = {
      nodes,
      edges,
      log: simulationLog
    };

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: dataToSave })
      });

      if (response.ok) {
        alert("프로젝트가 성공적으로 저장되었습니다!");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류가 발생했습니다.");
    }
  };

  // Add Node
  const addNode = (type: NodeType, label: string, modelTask?: string, modelType?: string) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      label,
      position: { x: 100 + nodes.length * 20, y: 100 + nodes.length * 20 },
      data: {
        // Default params based on type
        epochs: type === 'training' ? 10 : undefined,
        learningRate: type === 'training' ? 0.001 : undefined,
        // splitRatio removed
        modelType: modelType || (type === 'model' ? 'CNN' : undefined),
        preprocessType: type === 'preprocess' ? modelType : undefined,
        modelTask: modelTask, // classification or regression, OR subtype for dataset
        datasetSubtype: type === 'dataset' ? modelTask : undefined // Store subtype for dataset
      }
    };
    setNodes([...nodes, newNode]);
  };



  // Node Dragging Logic
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Check if clicking a handle (simple heuristic: if target is the dot)
    const target = e.target as HTMLElement;
    if (target.classList.contains('node-handle')) return;

    setIsDragging(true);
    setDragNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.position.x,
        y: e.clientY - rect.top - node.position.y
      });
    }
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      if (isDragging && dragNodeId) {
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        setNodes(nodes.map(n => n.id === dragNodeId ? { ...n, position: { x: newX, y: newY } } : n));
      }
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNodeId(null);
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStartId(null);
    }
    // Don't clear selection here because it might be a click on a node/edge
    // Selection clearing should happen on background click (mousedown or click)
  };

  // Connection Drag Logic
  const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string, handleType: 'right' | 'bottom' | 'left' | 'top') => {
    e.stopPropagation();
    e.preventDefault();

    const isSource = handleType === 'right' || handleType === 'bottom';

    // Case 1: Dragging from Source (Output) - Start new connection
    if (isSource) {
      setConnectionStartId(nodeId);
      setConnectionStartHandle(handleType as 'right' | 'bottom');
      setIsConnecting(true);
    }
    // Case 2: Dragging from Target (Input) - Disconnect & Reconnect
    else {
      // Find edge connected to this specific handle (or generic target for backward compat check)
      // We should ideally check handle too, but for now simple find is ok if we assume 1 input per node or careful mapping
      // Let's rely on target node ID check first.
      const existingEdge = edges.find(edge => edge.target === nodeId && (edge.targetHandle === handleType || (handleType === 'left' && !edge.targetHandle)));

      if (existingEdge) {
        // Remove existing edge
        setEdges(edges.filter(e => e.id !== existingEdge.id));

        // Start dragging from the original source
        setConnectionStartId(existingEdge.source);
        setConnectionStartHandle(existingEdge.sourceHandle || 'right');
        setIsConnecting(true);
      }
    }
  };

  const handleHandleMouseUp = (e: React.MouseEvent, nodeId: string, handleType: 'left' | 'top') => {
    e.stopPropagation();

    if (isConnecting && connectionStartId) {
      if (connectionStartId === nodeId) {
        return; // connecting to self
      }

      // Check if exists
      const exists = edges.find(edge => edge.source === connectionStartId && edge.target === nodeId);
      if (!exists) {
        const newEdge: FlowEdge = {
          id: `${connectionStartId}-${nodeId}-${Date.now()}`,
          source: connectionStartId,
          target: nodeId,
          sourceHandle: connectionStartHandle || 'right',
          targetHandle: handleType
        };
        setEdges([...edges, newEdge]);
      }

      setIsConnecting(false);
      setConnectionStartId(null);
      setConnectionStartHandle(null);
    }
  };

  // Remove Logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace')) {
      if (selectedNodeId && !editingNode) {
        setNodes(nodes.filter(n => n.id !== selectedNodeId));
        setEdges(edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
      } else if (selectedEdgeId && !editingNode) {
        setEdges(edges.filter(e => e.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    }
  };

  // Double Click for Properties
  const handleDoubleClick = (e: React.MouseEvent, node: FlowNode) => {
    e.stopPropagation();
    setEditingNode(node);
  };

  const updateNodeData = (updatedData: any) => {
    if (editingNode) {
      const updatedNode = { ...editingNode, data: { ...editingNode.data, ...updatedData } };
      setNodes(nodes.map(n => n.id === editingNode.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
      setEditingNode(updatedNode);
    }
  };

  // Helper: Find upstream dataset node
  const getUpstreamDataset = (currentNodeId: string): Dataset | undefined => {
    // Find edge where target is current node
    const edge = edges.find(e => e.target === currentNodeId);
    if (!edge) return undefined;

    const parentNode = nodes.find(n => n.id === edge.source);
    if (!parentNode) return undefined;

    if (parentNode.type === 'dataset' && parentNode.data.datasetId) {
      return availableDatasets.find(d => d.id === parentNode.data.datasetId);
    } else {
      // Recursive check for chain of nodes (e.g., Preprocess -> Preprocess)
      return getUpstreamDataset(parentNode.id);
    }
  };

  // Helper: Infer column types from dataset
  const inferColumnTypes = (dataset: Dataset) => {
    // ... existing logic
    try {
      const content = JSON.parse(dataset.content);
      // Check if data is in 'data' (single) or 'splits.train' (split)
      let rows: string[][] = [];

      if (content.data && content.data.length > 0) {
        rows = content.data;
      } else if (content.splits && content.splits.train && content.splits.train.length > 0) {
        rows = content.splits.train;
      }

      if (rows.length < 2) return { numeric: [], categorical: [] };

      const headers = rows[0];
      const firstRow = rows[1]; // Use first row to check types

      const numeric: string[] = [];
      const categorical: string[] = [];

      headers.forEach((header, index) => {
        const value = firstRow[index];
        // Simple heuristic: if parsable as number, it's numeric.
        if (!isNaN(Number(value)) && value.trim() !== '') {
          numeric.push(header);
        } else {
          categorical.push(header);
        }
      });

      return { numeric, categorical };

    } catch (e) {
      console.error("Failed to parse dataset for column inference", e);
      return { numeric: [], categorical: [] };
    }
  };

  // Helper: Get Upstream Data (Recursive)
  const getUpstreamData = (nodeId: string): { data?: string[][], splits?: { train?: string[][], validation?: string[][], test?: string[][] } } | null => {
    const edge = edges.find(e => e.target === nodeId);
    if (!edge) return null;

    const parentNode = nodes.find(n => n.id === edge.source);
    if (!parentNode) return null;

    // Case 1: Dataset Load Node
    if (parentNode.type === 'dataset' && (parentNode.data.datasetSubtype === 'dataset_load' || !parentNode.data.datasetSubtype)) {
      if (!parentNode.data.datasetId) return null;
      const dataset = availableDatasets.find(d => d.id === parentNode.data.datasetId);
      if (!dataset) return null;
      try {
        return JSON.parse(dataset.content);
      } catch (e) {
        console.error("Failed to parse upstream dataset", e);
        return null;
      }
    }

    // Case 2: Column Drop / Concatenate / Data Viewer
    // Recursive call

    // Special handling for Concatenate (Multiple Inputs)
    if (parentNode.type === 'dataset' && parentNode.data.datasetSubtype === 'concatenate') {
      const incomingEdges = edges.filter(e => e.target === nodeId);
      if (incomingEdges.length === 0) return null;

      const allData = incomingEdges.map(edge => {
        const pNode = nodes.find(n => n.id === edge.source);
        return pNode ? getUpstreamData(pNode.id) : null;
      }).filter(d => d !== null);

      if (allData.length === 0) return null;

      // Merge Logic (Vertical Concatenation)
      // Assuming same structure for simplicity.
      // 1. Merge 'data' (string[][])
      let mergedData: string[][] | undefined = undefined;
      const firstData = allData.find(d => d!.data);
      if (firstData && firstData.data) {
        const headers = firstData.data[0];
        let combinedRows: string[][] = [];

        allData.forEach((d, idx) => {
          if (d?.data) {
            if (idx === 0) {
              combinedRows = [...d.data];
            } else {
              // Skip header for subsequent datasets if they match
              // Simple check: same length header?
              if (d.data[0].length === headers.length) {
                combinedRows.push(...d.data.slice(1));
              }
            }
          }
        });
        mergedData = combinedRows;
      }

      return { data: mergedData };
    }

    // Normal single source recursion
    const upstreamData = getUpstreamData(parentNode.id);
    if (!upstreamData) return null;

    // Apply Column Drop
    if (parentNode.type === 'dataset' && parentNode.data.datasetSubtype === 'column_drop') {
      const droppedColumns = parentNode.data.droppedColumns as string[] || [];
      if (droppedColumns.length === 0) return upstreamData;

      const filterColumns = (rows: string[][]) => {
        if (rows.length === 0) return [];
        const headers = rows[0];
        const indicesKeep = headers.map((h, i) => droppedColumns.includes(h) ? -1 : i).filter(i => i !== -1);
        return rows.map(row => indicesKeep.map(i => row[i]));
      };

      if (upstreamData.data) {
        return { ...upstreamData, data: filterColumns(upstreamData.data) };
      } else if (upstreamData.splits) {
        return {
          ...upstreamData,
          splits: {
            train: upstreamData.splits.train ? filterColumns(upstreamData.splits.train) : undefined,
            validation: upstreamData.splits.validation ? filterColumns(upstreamData.splits.validation) : undefined,
            test: upstreamData.splits.test ? filterColumns(upstreamData.splits.test) : undefined,
          }
        };
      }
    }

    // Default: Return upstream data as is
    return upstreamData;
  };

  // Run Simulation
  const handleRun = async () => {
    if (nodes.length === 0) {
      alert("노드를 추가해주세요.");
      return;
    }
    setIsSimulating(true);
    setSimulationLog("클라우드 연결 중...\n노드 구조 분석 중...\n");

    try {
      const log = await simulateTraining(nodes, edges, user);
      setSimulationLog(prev => prev + "\n" + log);
    } catch (error) {
      setSimulationLog(prev => prev + "\n오류 발생.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Render SVG Lines
  const renderConnections = () => {
    const renderedEdges = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;

      const sourceHandle = edge.sourceHandle || 'right';
      const targetHandle = edge.targetHandle || 'left';

      // Calculate start points
      let sx = sourceNode.position.x;
      let sy = sourceNode.position.y;
      if (sourceHandle === 'right') { sx += 240; sy += 50; }
      else if (sourceHandle === 'bottom') { sx += 120; sy += 100; }

      // Calculate end points
      let tx = targetNode.position.x;
      let ty = targetNode.position.y;
      if (targetHandle === 'left') { ty += 50; }
      else if (targetHandle === 'top') { tx += 120; }

      // Control points
      let cp1x = sx, cp1y = sy, cp2x = tx, cp2y = ty;

      const curvature = 60; // Increased curvature for larger nodes
      if (sourceHandle === 'right') cp1x += curvature;
      else if (sourceHandle === 'bottom') cp1y += curvature;

      if (targetHandle === 'left') cp2x -= curvature;
      else if (targetHandle === 'top') cp2y -= curvature;

      // Bezier curve
      const d = `M${sx},${sy} C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;
      const isSelected = selectedEdgeId === edge.id;

      // Midpoint for delete button
      // Simple linear midpoint, might be off curve but good enough for now
      // Or we can evaluate bezier at t=0.5 but that's complex math
      // Approximate center of bounding box of control points?
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;

      return (
        <g key={edge.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          className="cursor-pointer group"
        >
          {/* Invisible wide path for hit testing */}
          <path
            d={d}
            stroke="transparent"
            strokeWidth="15"
            fill="none"
            className="pointer-events-auto"
          />
          {/* Visible path */}
          <path
            d={d}
            stroke={isSelected ? "#2563eb" : "#9ca3af"}
            strokeWidth={isSelected ? "4" : "3"}
            fill="none"
            className="transition-colors duration-200 pointer-events-none"
          />

          {/* Delete Button (visible when selected) */}
          {isSelected && (
            <g
              transform={`translate(${mx}, ${my})`}
              onClick={(e) => {
                e.stopPropagation();
                setEdges(edges.filter(e => e.id !== edge.id));
                setSelectedEdgeId(null);
              }}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              <circle r="10" fill="#ef4444" stroke="white" strokeWidth="2" />
              <path
                d="M-3 -3 L3 3 M3 -3 L-3 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      );
    });

    // Temp connection line
    if (isConnecting && connectionStartId) {
      const sourceNode = nodes.find(n => n.id === connectionStartId);
      if (sourceNode) {
        let sx = sourceNode.position.x;
        let sy = sourceNode.position.y;

        // Use updated connectionStartHandle state
        const handle = connectionStartHandle || 'right';

        if (handle === 'right') { sx += 240; sy += 50; }
        else if (handle === 'bottom') { sx += 120; sy += 100; }

        const tx = cursorPos.x;
        const ty = cursorPos.y;

        let cp1x = sx, cp1y = sy, cp2x = tx, cp2y = ty;
        const curvature = 60;

        if (handle === 'right') cp1x += curvature;
        else if (handle === 'bottom') cp1y += curvature;

        // Assume target is vaguely opposite or just adaptive?
        // For temp line, treat mouse as a generic target.
        // We can't know target handle yet, so just ease in from opposite of source?
        // Or just linear?
        // Let's guess target approach based on relative position.
        // If coming from left, target needs left handle -> cp2x -= curvature
        // If coming from top, target needs top handle -> cp2y -= curvature

        if (Math.abs(tx - sx) > Math.abs(ty - sy)) {
          // Horizontal dominant
          cp2x = tx + (tx > sx ? -curvature : curvature);
        } else {
          // Vertical dominant
          cp2y = ty + (ty > sy ? -curvature : curvature);
        }

        const d = `M${sx},${sy} C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;

        renderedEdges.push(
          <path
            key="temp-connection"
            d={d}
            stroke="#60a5fa"
            strokeWidth="3"
            strokeDasharray="5,5"
            fill="none"
            className="pointer-events-none"
          />
        );
      }
    }

    return renderedEdges;
  };

  return (
    <div
      className="flex h-full bg-white overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 1. Left Sidebar (Palette) */}
      <div className={`${isSidebarOpen ? 'w-64 border-r' : 'w-0 border-none'} bg-white border-gray-200 flex flex-col z-20 shadow-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden flex-shrink-0`}>
        <div className="p-4 flex flex-col h-full">
          <Button
            variant="secondary"
            className="w-full text-sm mb-6 flex items-center justify-center text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
            onClick={onBack}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            대시보드
          </Button>

          <div className="flex items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Components</h3>
          </div>

          {PALETTE_ITEMS.map((item) => (
            <div key={item.type} className="mb-2">
              <div
                onClick={() => {
                  if (item.subItems) {
                    setOpenDropdown(openDropdown === item.type ? null : item.type);
                  } else {
                    addNode(item.type, item.label);
                  }
                }}
                className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-university-400 hover:shadow-md transition-all flex items-center group relative overflow-hidden ${item.subItems && openDropdown === item.type ? 'ring-2 ring-university-100 border-university-300' : ''
                  }`}
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${item.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                <div className={`p-2 rounded-md mr-3 ${item.color} bg-opacity-20`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>

                {item.subItems && (
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === item.type ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>

              {/* Sub Items (Level 1 Dropdown) */}
              {item.subItems && openDropdown === item.type && (
                <div className="mt-1 ml-4 border-l-2 border-gray-100 pl-2 space-y-1 animate-fade-in-down">
                  {item.subItems.map(sub => (
                    <div key={sub.value}>
                      <div
                        onClick={() => {
                          if (sub.children) {
                            setOpenSubDropdown(openSubDropdown === sub.value ? null : sub.value);
                          } else {
                            addNode(item.type, `${item.label} (${sub.label})`, sub.value);
                          }
                        }}
                        className="p-2 text-sm text-gray-600 hover:text-university-600 hover:bg-university-50 rounded cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 hover:bg-university-500"></div>
                          {sub.label}
                        </div>
                        {sub.children && (
                          <svg className={`w-3 h-3 text-gray-400 transition-transform ${openSubDropdown === sub.value ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>

                      {/* Level 2 Dropdown (Specific Models) */}
                      {sub.children && openSubDropdown === sub.value && (
                        <div className="ml-4 border-l-2 border-gray-100 pl-2 space-y-1 mt-1 animate-fade-in-down">
                          {sub.children.map(child => (
                            <div
                              key={child.value}
                              onClick={() => addNode(item.type, `${child.label} Model`, sub.value, child.value)}
                              className="p-2 text-xs text-gray-500 hover:text-university-700 hover:bg-university-100 rounded cursor-pointer transition-colors flex items-center"
                            >
                              • {child.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shadow-sm relative shrink-0">
          {/* Left: Sidebar Toggle & Logo */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>

            <div className="h-6 w-px bg-gray-200"></div>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-university-600 text-white p-1.5 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800 text-lg tracking-tight">{APP_NAME}</span>
            </div>
          </div>

          {/* Center: Project Title */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none pointer-events-none">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 pointer-events-auto">
              {project.title}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                AI FLOW
              </span>
            </h2>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="text-xs h-8 px-3 text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              onClick={() => {
                if (confirm("모든 노드를 초기화하시겠습니까? 저장되지 않은 내용은 삭제됩니다.")) {
                  setNodes([]);
                  setEdges([]);
                  setSimulationLog("");
                }
              }}
            >
              초기화
            </Button>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <Button
              variant="outline"
              className="text-xs h-8 px-3 flex items-center gap-1.5 font-medium"
              onClick={handleSave}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              저장
            </Button>
            <Button
              variant="primary"
              className="text-xs h-8 px-4 font-semibold shadow-sm flex items-center gap-1.5"
              onClick={handleRun}
              isLoading={isSimulating}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              실행
            </Button>
          </div>
        </div>

        {/* Workspace Area */}
        <div
          className="flex-1 bg-slate-50 relative overflow-hidden cursor-crosshair"
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={(e) => {
            // Clear selection if clicking on empty background
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }
          }}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#6b7280 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* SVG Layer for Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderConnections()}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const styleInfo = PALETTE_ITEMS.find(i => i.type === node.type) || PALETTE_ITEMS[0];
            const isSelected = selectedNodeId === node.id;
            const isSource = connectionStartId === node.id;

            const isDataViewer = node.type === 'dataset' && node.data.datasetSubtype === 'data_viewer';
            const incomingEdges = edges.filter(e => e.target === node.id);
            const hasIncoming = incomingEdges.length > 0;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onDoubleClick={(e) => handleDoubleClick(e, node)}
                className={`absolute w-[240px] h-[100px] rounded-xl shadow-md border-2 bg-white flex items-center p-3 transition-shadow z-10 select-none ${isSelected ? 'border-university-500 ring-2 ring-university-200' : 'border-gray-200 hover:border-gray-300'
                  } ${isSource ? 'ring-2 ring-green-400' : ''}`}
                style={{ left: node.position.x, top: node.position.y }}
              >
                {/* Input Handles */}
                {/* Left - Show if normal node, OR not connected, OR connected at this handle */}
                {(!isDataViewer || !hasIncoming || incomingEdges.some(e => (e.targetHandle || 'left') === 'left')) && (
                  <div
                    className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full hover:bg-green-100 hover:border-green-500 cursor-pointer node-handle flex items-center justify-center z-20"
                    title="입력 (Left)"
                    onMouseUp={(e) => handleHandleMouseUp(e, node.id, 'left')}
                    onMouseDown={(e) => handleHandleMouseDown(e, node.id, 'left')}
                  >
                    <div className="w-2 h-2 bg-gray-400 rounded-full pointer-events-none" />
                  </div>
                )}
                {/* Top - Show if normal node, OR not connected, OR connected at this handle */}
                {(!isDataViewer || !hasIncoming || incomingEdges.some(e => e.targetHandle === 'top')) && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full hover:bg-green-100 hover:border-green-500 cursor-pointer node-handle flex items-center justify-center z-20"
                    title="입력 (Top)"
                    onMouseUp={(e) => handleHandleMouseUp(e, node.id, 'top')}
                    onMouseDown={(e) => handleHandleMouseDown(e, node.id, 'top')}
                  >
                    <div className="w-2 h-2 bg-gray-400 rounded-full pointer-events-none" />
                  </div>
                )}

                {/* Content */}
                <div className={`p-2 rounded-lg mr-3 ${styleInfo.color}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styleInfo.icon} />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{node.label}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{node.type}</p>
                  {node.type === 'dataset' && node.data.datasetName && node.data.datasetSubtype !== 'column_drop' && (
                    <p className="text-[10px] text-blue-600 truncate max-w-[120px]" title={node.data.datasetName}>
                      {node.data.datasetName}
                    </p>
                  )}
                  {node.type === 'dataset' && node.data.datasetSubtype === 'column_drop' && (
                    <p className="text-[10px] text-red-500 truncate max-w-[120px]">
                      {node.data.droppedColumns?.length ? `${node.data.droppedColumns.length} cols dropped` : 'No cols dropped'}
                    </p>
                  )}
                </div>

                {/* Output Handles */}
                {/* Right */}
                {(!isDataViewer || !hasIncoming) && (
                  <div
                    className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full hover:bg-blue-100 hover:border-blue-500 cursor-pointer node-handle flex items-center justify-center z-20 ${connectionStartId === node.id && connectionStartHandle === 'right' ? 'bg-blue-500 border-blue-600' : ''
                      }`}
                    title="출력 (Right)"
                    onMouseDown={(e) => handleHandleMouseDown(e, node.id, 'right')}
                  >
                    <div className={`w-2 h-2 rounded-full pointer-events-none ${connectionStartId === node.id && connectionStartHandle === 'right' ? 'bg-white' : 'bg-gray-400'}`} />
                  </div>
                )}
                {/* Bottom */}
                {(!isDataViewer || !hasIncoming) && (
                  <div
                    className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full hover:bg-blue-100 hover:border-blue-500 cursor-pointer node-handle flex items-center justify-center z-20 ${connectionStartId === node.id && connectionStartHandle === 'bottom' ? 'bg-blue-500 border-blue-600' : ''
                      }`}
                    title="출력 (Bottom)"
                    onMouseDown={(e) => handleHandleMouseDown(e, node.id, 'bottom')}
                  >
                    <div className={`w-2 h-2 rounded-full pointer-events-none ${connectionStartId === node.id && connectionStartHandle === 'bottom' ? 'bg-white' : 'bg-gray-400'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Console */}
        <div className="h-48 bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-y-auto border-t border-gray-700 shadow-inner z-20">
          <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
            <span className="font-bold">TERMINAL OUTPUT</span>
            <span className="text-xs text-gray-500">v1.0.2</span>
          </div>
          <pre className="whitespace-pre-wrap">{simulationLog || "Ready to run..."}</pre>
        </div>
      </div>

      {/* Properties Modal */}
      {editingNode && (
        <Modal
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          title={`${editingNode.label} 속성 설정`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">노드 이름</label>
              <input
                type="text"
                value={editingNode.label}
                onChange={(e) => updateNodeData({ labelOverride: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-university-500"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">노드 이름은 변경할 수 없습니다.</p>
            </div>

            {editingNode.type === 'training' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Epochs (학습 횟수)</label>
                  <input
                    type="number"
                    value={editingNode.data.epochs || 10}
                    onChange={(e) => updateNodeData({ epochs: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-university-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Rate (학습률)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingNode.data.learningRate || 0.001}
                    onChange={(e) => updateNodeData({ learningRate: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-university-500"
                  />
                </div>
              </>
            )}

            {editingNode.type === 'preprocess' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대상 컬럼 (자동 감지됨)</label>
                {(() => {
                  // Use getUpstreamData instead of getUpstreamDataset to respect Column Drop nodes
                  const upstreamData = getUpstreamData(editingNode.id);

                  if (!upstreamData || (!upstreamData.data && !upstreamData.splits)) {
                    return <p className="text-sm text-gray-500">연결된 데이터가 없습니다. 데이터셋 노드를 먼저 연결해주세요.</p>;
                  }

                  // Infer columns directly from the data
                  const inferColumnsFromData = () => {
                    let rows: string[][] = [];
                    if (upstreamData.data && upstreamData.data.length > 0) {
                      rows = upstreamData.data;
                    } else if (upstreamData.splits && upstreamData.splits.train && upstreamData.splits.train.length > 0) {
                      rows = upstreamData.splits.train;
                    }

                    if (rows.length < 2) return { numeric: [], categorical: [] };

                    const headers = rows[0];
                    const firstRow = rows[1];
                    const numeric: string[] = [];
                    const categorical: string[] = [];

                    headers.forEach((header, index) => {
                      const value = firstRow[index];
                      if (!isNaN(Number(value)) && value.trim() !== '') {
                        numeric.push(header);
                      } else {
                        categorical.push(header);
                      }
                    });
                    return { numeric, categorical };
                  };

                  const columns = inferColumnsFromData();

                  const type = editingNode.data.preprocessType || editingNode.data.modelType;

                  let autoDetectedColumns: string[] = [];
                  let typeLabel = "";

                  if (['Normalization', 'Standardization'].includes(type || '')) {
                    autoDetectedColumns = columns.numeric;
                    typeLabel = "수치형(Numeric)";
                  } else if (['OneHot'].includes(type || '')) {
                    autoDetectedColumns = columns.categorical;
                    typeLabel = "범주형(Categorical)";
                  } else if (type === 'Imputer') {
                    autoDetectedColumns = [...columns.numeric, ...columns.categorical];
                    typeLabel = "전체(All)";
                  } else {
                    autoDetectedColumns = [...columns.numeric, ...columns.categorical];
                    typeLabel = "전체(All)";
                  }

                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        {typeLabel} 컬럼 ({autoDetectedColumns.length}개)
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {autoDetectedColumns.length === 0 && <p className="text-xs text-gray-400">해당 타입의 컬럼이 없습니다.</p>}
                        {autoDetectedColumns.map(col => (
                          <span key={col} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-2">
                  선택한 전처리 방식에 적합한 컬럼이 자동으로 선택됩니다.
                </p>
              </div>
            )}

            {/* Data Viewer UI - Render specific viewer instead of standard form if subtype is data_viewer */}
            {editingNode.type === 'dataset' && editingNode.data.datasetSubtype === 'data_viewer' && (
              <div className="h-[600px] -m-4">
                {(() => {
                  const data = getUpstreamData(editingNode.id);
                  if (!data) return <div className="p-8 text-center text-gray-500">연결된 데이터가 없습니다.</div>;

                  return (
                    <DatasetViewer
                      data={data.data}
                      splits={data.splits}
                      fileName="Data Viewer"
                      onBack={() => { }} // Create a back/close logic if needed, currently Modal close handles it
                      onSave={undefined} // Read-only
                    />
                  );
                })()}
              </div>
            )}

            {/* Standard Dataset Form (Load/Drop) */}
            {editingNode.type === 'dataset' && editingNode.data.datasetSubtype !== 'data_viewer' && (
              <>
                {/* Dataset Load UI */}
                {(editingNode.data.datasetSubtype === 'dataset_load' || !editingNode.data.datasetSubtype) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">데이터셋 선택</label>
                    <select
                      value={editingNode.data.datasetId || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedDataset = availableDatasets.find(d => d.id === selectedId);
                        updateNodeData({
                          datasetId: selectedId,
                          datasetName: selectedDataset?.name
                        });
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-university-500"
                    >
                      <option value="">데이터셋을 선택하세요</option>
                      {availableDatasets.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Column Drop UI */}
                {editingNode.data.datasetSubtype === 'column_drop' && (
                  <div>
                    {(() => {
                      const dataset = getUpstreamDataset(editingNode.id);
                      if (!dataset) {
                        return <p className="text-sm text-gray-500">연결된 데이터셋이 없습니다. 데이터셋 노드를 먼저 연결해주세요.</p>;
                      }

                      const columns = inferColumnTypes(dataset);
                      const allColumns = [...columns.numeric, ...columns.categorical];
                      const droppedColumns = editingNode.data.droppedColumns as string[] || [];
                      const targetColumn = editingNode.data.targetColumn as string | undefined;

                      return (
                        <div className="space-y-4">
                          {/* Drop Columns Section */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">제거할 컬럼 선택 (Drop)</label>
                            <div className="border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
                              {allColumns.length === 0 && <p className="text-xs text-gray-400">선택 가능한 컬럼이 없습니다.</p>}
                              {allColumns.map(col => (
                                <label key={`drop-${col}`} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={droppedColumns.includes(col)}
                                    disabled={targetColumn === col} // Disable if it is the target
                                    onChange={(e) => {
                                      const current = editingNode.data.droppedColumns || [];
                                      let next: string[];
                                      if (e.target.checked) {
                                        next = [...current, col];
                                      } else {
                                        next = current.filter(c => c !== col);
                                      }
                                      updateNodeData({ droppedColumns: next });
                                    }}
                                    className="rounded text-red-600 focus:ring-red-500"
                                  />
                                  <span className={`text-sm ${targetColumn === col ? 'text-gray-400 decoration-line-through' : 'text-gray-700'}`}>{col}</span>
                                  {targetColumn === col && <span className="text-xs text-blue-500 ml-2">(Target)</span>}
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">체크한 컬럼은 데이터에서 제거됩니다.</p>
                          </div>

                          {/* Target Column Section */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">타겟 컬럼 선택 (Target)</label>
                            <div className="border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50">
                              {allColumns.length === 0 && <p className="text-xs text-gray-400">선택 가능한 컬럼이 없습니다.</p>}
                              {allColumns.map(col => (
                                <label key={`target-${col}`} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100 rounded px-1">
                                  <input
                                    type="radio"
                                    name="targetColumn"
                                    checked={targetColumn === col}
                                    disabled={droppedColumns.includes(col)} // Disable if it is dropped
                                    onChange={() => {
                                      updateNodeData({ targetColumn: col });
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={`text-sm ${droppedColumns.includes(col) ? 'text-gray-400 decoration-line-through' : 'text-gray-700'}`}>{col}</span>
                                  {droppedColumns.includes(col) && <span className="text-xs text-red-500 ml-2">(Dropped)</span>}
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">예측하려는 정답(Label) 컬럼을 선택하세요.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}

            {editingNode.type === 'model' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Architecture</label>
                <select
                  value={editingNode.data.modelType || 'CNN'}
                  onChange={(e) => updateNodeData({ modelType: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-university-500"
                >
                  <option value="CNN">CNN (Convolutional Neural Network)</option>
                  <option value="RNN">RNN (Recurrent Neural Network)</option>
                  <option value="MLP">MLP (Multi-Layer Perceptron)</option>
                </select>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => {
                // Auto-save inferred columns for Preprocess nodes on close
                if (editingNode.type === 'preprocess') {
                  // Re-run inference to get current columns based on type
                  const upstreamData = getUpstreamData(editingNode.id);
                  if (upstreamData) {
                    let rows: string[][] = [];
                    if (upstreamData.data && upstreamData.data.length > 0) rows = upstreamData.data;
                    else if (upstreamData.splits && upstreamData.splits.train) rows = upstreamData.splits.train;

                    if (rows.length >= 2) {
                      const headers = rows[0];
                      const firstRow = rows[1];
                      const numeric: string[] = [];
                      const categorical: string[] = [];
                      headers.forEach((header, index) => {
                        const value = firstRow[index];
                        if (!isNaN(Number(value)) && value.trim() !== '') numeric.push(header);
                        else categorical.push(header);
                      });

                      const type = editingNode.data.preprocessType || editingNode.data.modelType;
                      let autoSelected: string[] = [];
                      if (['Normalization', 'Standardization'].includes(type || '')) {
                        autoSelected = numeric;
                      } else if (['OneHot'].includes(type || '')) {
                        autoSelected = categorical;
                      } else {
                        autoSelected = [...numeric, ...categorical];
                      }

                      // Update the node directly in the state
                      setNodes(nodes.map(n => n.id === editingNode.id ? { ...n, data: { ...n.data, selectedColumns: autoSelected } } : n));
                    }
                  }
                }
                setEditingNode(null);
              }}>
                완료
              </Button>
            </div>
          </div>
        </Modal >
      )}
    </div >
  );
};

export default FlowWorkspace;