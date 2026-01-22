import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TEXT_MODEL } from "../constants";
import { StudentUser, FlowNode, FlowEdge } from "../types";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const generateAIResponse = async (
  prompt: string,
  userContext: StudentUser,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const systemInstruction = `
      You are a helpful, encouraging, and knowledgeable University AI Teaching Assistant. 
      You are currently helping a student named ${userContext.name} who is in ${userContext.grade} at ${userContext.school}.
      Always answer in Korean.
    `;

    const chat = ai.chats.create({
      model: TEXT_MODEL,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: history,
    });

    const result: GenerateContentResponse = await chat.sendMessage({
        message: prompt
    });

    return result.text || "죄송합니다. 답변을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const simulateTraining = async (
  nodes: FlowNode[],
  edges: FlowEdge[],
  userContext: StudentUser
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Construct a textual representation of the graph
    const flowDescription = JSON.stringify({ nodes, edges }, null, 2);
    
    const prompt = `
      The student has designed a Machine Learning pipeline using a node-based visual editor.
      Here is the structure of their flow (Nodes and Edges):
      ${flowDescription}

      Please act as a "Training Simulator Console". 
      1. Analyze the logic of their flow. Does it make sense? (e.g., Dataset -> Preprocess -> Model -> Train -> Eval).
      2. If the logic is sound, simulate a training log output. Show epochs, loss decreasing, and final accuracy.
      3. If the logic is broken (e.g., Model connected directly to Eval without Training), explain the error like a compiler error message.
      4. Keep the tone educational but technical enough for a university lab simulation.
      5. Output format should look like a terminal log.
      6. Language: Korean.
    `;

    const result: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });

    return result.text || "시뮬레이션 결과를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Simulation Error:", error);
    return "시스템 오류: 시뮬레이션을 실행할 수 없습니다.";
  }
};
