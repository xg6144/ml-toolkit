export interface StudentUser {
  id?: string;
  school: string;
  grade: string;
  name: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  type: 'chat' | 'vision' | 'coding' | 'flow';
  content?: string; // JSON string of nodes/edges
}

export interface Dataset {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  content: string; // JSON string of data/splits
  is_public: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum LabMode {
  Chat = 'CHAT',
  Vision = 'VISION',
  Coding = 'CODING'
}

// Flow Workspace Types
export type NodeType = 'dataset' | 'preprocess' | 'model' | 'training' | 'evaluation';

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, any>; // Parameters like epochs, learning rate
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'right' | 'bottom';
  targetHandle?: 'left' | 'top';
}
