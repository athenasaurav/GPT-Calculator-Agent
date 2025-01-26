import React, { useState, useEffect, useRef } from 'react';
import { Key, CheckCircle, XCircle, Mic, MicOff, DollarSign, Clock, MessageSquare, Send, User, Bot } from 'lucide-react';
import OpenAI from 'openai';
import { calculateTTSCost, calculateGPTCost, CostBreakdown } from './utils/pricing';

interface SessionStats {
  inputTime: number;
  outputTime: number;
  costs: CostBreakdown;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visible?: boolean;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
];

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [openai, setOpenai] = useState<OpenAI | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    inputTime: 0,
    outputTime: 0,
    costs: { tts: 0, stt: 0, gptInput: 0, gptOutput: 0 }
  });
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const speakingStartTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (apiKey && apiKey.startsWith('sk-') && apiKey.length > 20) {
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      setOpenai(client);
      
      const validateApiKey = async () => {
        try {
          await client.models.list();
          setIsApiKeyValid(true);
        } catch (error) {
          setIsApiKeyValid(false);
          console.error('Invalid API key:', error);
        }
      };
      
      validateApiKey();
    } else {
      setIsApiKeyValid(false);
      setOpenai(null);
    }
  }, [apiKey]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        startTimeRef.current = Date.now();
        setIsListening(true);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        console.log('Recognized text:', text);
        
        if (event.results[last].isFinal && openai && isApiKeyValid) {
          const inputDuration = (Date.now() - startTimeRef.current) / 1000;
          setIsProcessing(true);
          
          try {
            // Prepare messages array with system prompt if provided
            const messagesForAPI = [];
            if (systemPrompt) {
              messagesForAPI.push({ role: "system", content: systemPrompt });
              // Add system message but mark it as not visible
              setMessages(prev => [...prev, {
                role: 'system',
                content: systemPrompt,
                timestamp: new Date(),
                visible: false
              }]);
            }
            messagesForAPI.push({ role: "user", content: text });
            setMessages(prev => [...prev, {
              role: 'user',
              content: text,
              timestamp: new Date(),
              visible: true
            }]);

            // Get GPT response
            const completion = await openai.chat.completions.create({
              model: selectedModel,
              messages: messagesForAPI
            });

            const response = completion.choices[0].message.content || "I'm sorry, I couldn't process that.";
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: response,
              timestamp: new Date(),
              visible: true
            }]);
            
            // Create speech from response
            speakingStartTimeRef.current = Date.now();
            const ttsResponse = await openai.audio.speech.create({
              model: "tts-1",
              voice: "alloy",
              input: response
            });

            // Update costs
            const gptCosts = calculateGPTCost(
              completion.usage?.prompt_tokens || 0,
              completion.usage?.completion_tokens || 0
            );
            const ttsCost = calculateTTSCost(response.length);

            // Play the audio
            if (audioContextRef.current) {
              const audioData = await ttsResponse.arrayBuffer();
              const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current.destination);
              
              setIsSpeaking(true);
              setIsProcessing(false);
              source.start(0);
              
              source.onended = () => {
                setIsSpeaking(false);
                const outputDuration = (Date.now() - speakingStartTimeRef.current) / 1000;
                
                setSessionStats(prev => ({
                  inputTime: prev.inputTime + inputDuration,
                  outputTime: prev.outputTime + outputDuration,
                  costs: {
                    tts: prev.costs.tts + ttsCost,
                    stt: prev.costs.stt,
                    gptInput: prev.costs.gptInput + gptCosts.input,
                    gptOutput: prev.costs.gptOutput + gptCosts.output
                  }
                }));
              };
            }
          } catch (error) {
            console.error('Error processing voice:', error);
            setIsListening(false);
            setIsProcessing(false);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };
    }

    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [openai, isApiKeyValid, systemPrompt, selectedModel]);

  const toggleListening = () => {
    if (!isApiKeyValid) {
      alert('Please enter a valid OpenAI API key first');
      return;
    }

    if (isListening) {
      console.log('Stopping recognition');
      recognitionRef.current?.stop();
    } else {
      console.log('Starting recognition');
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const totalCost = Object.values(sessionStats.costs).reduce((a, b) => a + b, 0);

  // Filter visible messages for the log
  const visibleMessages = messages.filter(message => message.visible !== false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Real-time Voice Chat</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <div>Input: {sessionStats.inputTime.toFixed(1)}s</div>
                  <div>Output: {sessionStats.outputTime.toFixed(1)}s</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <div>Total: ${totalCost.toFixed(4)}</div>
                  <div className="text-xs text-gray-500">
                    TTS: ${sessionStats.costs.tts.toFixed(4)} | 
                    GPT: ${(sessionStats.costs.gptInput + sessionStats.costs.gptOutput).toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-gray-600" />
                <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
              </div>
              {apiKey && (
                <div className="flex items-center space-x-1">
                  {isApiKeyValid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-500">Valid API Key</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-500">Invalid API Key</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="Enter your OpenAI API key (starts with 'sk-')"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <label htmlFor="model" className="text-sm font-medium text-gray-700">
                Chat Model
              </label>
            </div>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <label htmlFor="systemPrompt" className="text-sm font-medium text-gray-700">
                Conversation Guide (System Prompt)
              </label>
            </div>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a system prompt to guide the conversation (e.g., 'You are a helpful French teacher helping me practice conversations')"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 resize-none"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Session Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium">Time Stats</p>
                <p>Input Time: {sessionStats.inputTime.toFixed(1)} seconds</p>
                <p>Output Time: {sessionStats.outputTime.toFixed(1)} seconds</p>
              </div>
              <div>
                <p className="font-medium">Cost Breakdown</p>
                <p>TTS: ${sessionStats.costs.tts.toFixed(4)}</p>
                <p>GPT Input: ${sessionStats.costs.gptInput.toFixed(4)}</p>
                <p>GPT Output: ${sessionStats.costs.gptOutput.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={toggleListening}
              className={`p-6 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white ${(isSpeaking || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isApiKeyValid || isSpeaking || isProcessing}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            {isListening && (
              <span className="text-indigo-600 animate-pulse">Listening...</span>
            )}
            {isProcessing && (
              <span className="text-yellow-600">Processing...</span>
            )}
            {isSpeaking && (
              <span className="text-green-600">Speaking...</span>
            )}
          </div>
        </div>
      </div>

      {/* Message Log Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Message Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {visibleMessages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                message.role === 'user'
                  ? 'items-end'
                  : message.role === 'system'
                  ? 'items-center'
                  : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-100 text-indigo-900'
                    : message.role === 'system'
                    ? 'bg-gray-100 text-gray-800 italic'
                    : 'bg-green-100 text-green-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : message.role === 'system' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default App;