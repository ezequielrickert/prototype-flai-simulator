# ElevenLabs Integration Setup

This document explains how to set up and use the ElevenLabs AI assistant integration in your ethics training application.

## Setup Instructions

### 1. Environment Configuration

**Security Note**: Your ElevenLabs credentials should be added to the existing `.env` file (which is already configured and not tracked by git).

Add the following environment variables to your existing `.env` file:

```bash
# Add these to your existing .env file
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

The `.env` file is already properly configured and ignored by git for security.

### 2. Files Created

**Security Note**: The `.gitignore` file already includes `.env*` which ensures environment files with sensitive data are not committed to version control.

#### API Routes
- `/app/api/elevenlabs-chat/route.ts` - Main API endpoint for ElevenLabs agent communication

#### Components
- `/components/elevenlabs-chatbot.tsx` - React component for the chatbot interface

#### Hooks
- `/hooks/use-elevenlabs-chat.ts` - Custom hook for managing chat state and API calls

#### Services
- `/lib/elevenlabs-service.ts` - Service class for ElevenLabs API interactions

#### Pages
- `/app/elevenlabs-demo/page.tsx` - Demo page showcasing the ElevenLabs integration

#### Configuration Files
- `.env` - Your actual environment variables (already configured, not tracked by git)
- `.env.example` - Template for reference (safe to commit)

### 3. Features Implemented

#### ✅ Core Functionality
- **Conversation Management**: Create and manage conversations with ElevenLabs agents
- **Message Sending**: Send text messages to the AI agent
- **Real-time Responses**: Receive AI responses in real-time
- **Conversation History**: Retrieve and display conversation history

#### ✅ Voice Features
- **Speech-to-Text**: Use browser's built-in speech recognition (Spanish Argentina)
- **Text-to-Speech**: Play audio responses from ElevenLabs
- **Voice Input Toggle**: Microphone button for voice input

#### ✅ UI Components
- **Modern Chat Interface**: Clean, responsive chatbot UI
- **Message Bubbles**: Distinct styling for user and AI messages
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages

### 4. How to Use

#### Start the Development Server
```bash
npm run dev
```

#### Access the Demo
Navigate to `http://localhost:3000/elevenlabs-demo` to see the ElevenLabs integration in action.

#### Main Application
The main application at `http://localhost:3000` now includes an "AI Assistant" button in the header.

### 5. API Endpoints

#### POST `/api/elevenlabs-chat`
Create or continue a conversation with the ElevenLabs agent.

**Request Body:**
```json
{
  "message": "Your question here",
  "conversationId": "optional-existing-conversation-id", 
  "scenario": {
    "title": "Scenario title",
    "description": "Scenario description"
  }
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conversation-id",
  "response": { /* Raw ElevenLabs response */ },
  "agentResponse": {
    "text": "AI response text",
    "audio_url": "optional-audio-url"
  }
}
```

#### GET `/api/elevenlabs-chat?conversationId=<id>`
Retrieve conversation history.

**Response:**
```json
{
  "success": true,
  "conversation": { /* Conversation data */ }
}
```

### 6. Component Usage

#### Basic Usage
```tsx
import { ElevenLabsChatbot } from "@/components/elevenlabs-chatbot";

function MyPage() {
  const scenario = {
    title: "Ethics Scenario",
    description: "A challenging ethical situation"
  };

  return (
    <ElevenLabsChatbot 
      scenario={scenario}
      className="h-96" 
    />
  );
}
```

#### Hook Usage
```tsx
import { useElevenLabsChat } from "@/hooks/use-elevenlabs-chat";

function MyComponent() {
  const { 
    conversation, 
    isLoading, 
    error, 
    sendMessage, 
    startNewConversation 
  } = useElevenLabsChat();

  const handleSend = async () => {
    await sendMessage("Hello, AI assistant!");
  };

  // ... component logic
}
```

### 7. Configuration Options

#### Voice Recognition
- Language: Spanish (Argentina) - `es-AR`
- Engine: Browser's built-in `webkitSpeechRecognition`
- Fallback: Manual text input if voice recognition unavailable

#### ElevenLabs Settings
- Default Voice ID: `21m00Tcm4TlvDq8ikWAM`
- Model: `eleven_monolingual_v1`
- Voice Settings: Stability 0.5, Similarity Boost 0.5

### 8. Error Handling

The integration includes comprehensive error handling:
- **API Errors**: Network and ElevenLabs API errors
- **Browser Compatibility**: Fallbacks for unsupported features
- **User Feedback**: Clear error messages in the UI
- **Logging**: Console logging for debugging

### 9. Customization

#### Styling
The chatbot component uses Tailwind CSS and can be customized through:
- `className` prop for additional styling
- CSS variables for theme colors
- Component slots for custom UI elements

#### Behavior
- Conversation scenarios can be passed as props
- Voice settings can be configured in the service
- Audio playback can be customized

### 10. Troubleshooting

#### Common Issues

**"Method Not Allowed" Error**
This error indicates the API endpoint or HTTP method is incorrect. The updated API route includes:
- Multiple endpoint testing approaches
- Detailed error logging with status codes
- Alternative endpoint fallbacks

**No API Response**
- Verify environment variables are set correctly
- Check ElevenLabs API key permissions
- Ensure agent ID is valid
- Check browser developer tools for detailed error messages

**Voice Recognition Not Working**
- Check browser compatibility (Chrome/Edge recommended)
- Ensure microphone permissions are granted
- Test with manual text input as fallback

**Audio Playback Issues**
- Verify audio URLs in responses
- Check browser audio permissions
- Ensure network connectivity

#### Debug Steps

1. **Check Configuration**: The API route now shows configuration status in error messages
2. **Verify Agent**: The route tests agent accessibility before attempting conversations
3. **Monitor Console**: Check both browser and server console for detailed error logs
4. **API Response**: The route returns detailed error information including status codes and suggestions

#### Recent Fixes

- ✅ Fixed API endpoint structure for conversation creation
- ✅ Added comprehensive error handling and debugging
- ✅ Implemented alternative endpoint fallbacks
- ✅ Added agent verification before conversation attempts
- ✅ Enhanced error messages with actionable suggestions

#### Debug Information
Check the browser console for detailed error messages and API response logs.

---

## Next Steps

1. **Test the Integration**: Visit `/elevenlabs-demo` to test the functionality
2. **Customize Agent**: Configure your ElevenLabs agent for ethics training
3. **Add Scenarios**: Create specific ethics scenarios for training
4. **Enhance UI**: Customize the chatbot appearance to match your design
5. **Monitor Usage**: Add analytics to track user interactions

The ElevenLabs integration is now ready to use! 🎉
