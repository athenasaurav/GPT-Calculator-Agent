export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionStats {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface AudioRecorderProps {
  onAudioData: (audioBlob: Blob) => Promise<void>;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}