# AI Voice Chat

A real-time voice chat application that enables natural conversations with AI using OpenAI's GPT models and text-to-speech capabilities.

![Voice Chat Demo](https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=1200)

## Features

- 🎙️ Real-time voice input using Web Speech API
- 🤖 Multiple AI model options (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, etc.)
- 🔊 Text-to-speech response playback
- 📊 Cost tracking and usage statistics
- 💬 Message history with role-based styling
- 🎯 Customizable system prompts for guided conversations
- ⚡ Built with React, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js 18.x or higher
- OpenAI API key
- Modern web browser with Web Speech API support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-voice-chat.git
cd ai-voice-chat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Enter your OpenAI API key in the input field
2. (Optional) Select your preferred AI model from the dropdown
3. (Optional) Enter a system prompt to guide the conversation
4. Click the microphone button to start speaking
5. Wait for the AI's response, which will be played back automatically
6. View conversation history and statistics in the sidebar

## Available Models

- GPT-4
- GPT-4 Turbo
- GPT-4o
- GPT-4o Mini
- GPT-3.5 Turbo
- GPT-3.5 Turbo 16K

## Cost Tracking

The application tracks costs for:
- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- GPT model usage (input and output tokens)

## Project Structure

```
src/
├── components/
│   └── AudioRecorder.tsx    # Audio recording component
├── utils/
│   └── pricing.ts          # Cost calculation utilities
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key |

## Technical Details

- Built with Vite for fast development and optimized builds
- Uses Web Speech API for voice input
- Implements OpenAI's API for:
  - Chat completions (GPT models)
  - Text-to-speech conversion
- Real-time cost calculation and tracking
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Browser Compatibility

- Chrome (recommended)
- Edge
- Safari
- Firefox

Note: Web Speech API support may vary across browsers.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for their powerful AI models and APIs
- Lucide React for beautiful icons
- Tailwind CSS for styling
- Web Speech API for voice capabilities