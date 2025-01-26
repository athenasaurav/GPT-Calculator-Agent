// OpenAI API pricing (as of 2024)
const TTS_COST_PER_1K_CHARS = 0.015;  // Text-to-Speech cost
const STT_COST_PER_MINUTE = 0.006;    // Speech-to-Text cost

// GPT model pricing per 1K tokens
const MODEL_PRICING = {
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-4-turbo-preview': {
    input: 0.01,
    output: 0.03
  },
  'gpt-4o': {
    input: 0.01,
    output: 0.03
  },
  'gpt-4o-mini': {
    input: 0.001,
    output: 0.002
  },
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015
  },
  'gpt-3.5-turbo-16k': {
    input: 0.001,
    output: 0.002
  }
};

export interface CostBreakdown {
  tts: number;
  stt: number;
  gptInput: number;
  gptOutput: number;
}

export const calculateTTSCost = (characterCount: number): number => {
  return (characterCount / 1000) * TTS_COST_PER_1K_CHARS;
};

export const calculateSTTCost = (durationInSeconds: number): number => {
  return (durationInSeconds / 60) * STT_COST_PER_MINUTE;
};

export const calculateGPTCost = (
  inputTokens: number, 
  outputTokens: number, 
  model: string = 'gpt-4'
): { input: number; output: number } => {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-4'];
  
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  
  return { input: inputCost, output: outputCost };
};