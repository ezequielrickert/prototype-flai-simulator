class OpenAIRealtimeChat {
    constructor() {
        this.pc = null;
        this.dc = null;
        this.isConnected = false;
        
        // DOM elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.messages = document.getElementById('messages');
        this.audioOutput = document.getElementById('audioOutput');
        
        // Bind event listeners
        this.startBtn.addEventListener('click', () => this.startConversation());
        this.stopBtn.addEventListener('click', () => this.stopConversation());
        
        // Check for API key
        this.apiKey = this.getApiKey();
        if (!this.apiKey) {
            this.updateStatus('Please set your OpenAI API key in the script', 'error');
            this.startBtn.disabled = true;
        }
    }
    
    getApiKey() {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        
        if (apiKey === '') {
            return null;
        }
        return apiKey;
    }
    
    updateStatus(message, type = 'normal') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
    }
    
    addMessage(message, type = 'system') {
        const messageElement = document.createElement('p');
        messageElement.className = `${type}-message`;
        messageElement.textContent = message;
        this.messages.appendChild(messageElement);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    async startConversation() {
        try {
            this.updateStatus('Connecting...', 'connecting');
            this.startBtn.disabled = true;
            
            // Create RTCPeerConnection
            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            // Get user media (microphone)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Add microphone track to peer connection
            stream.getTracks().forEach(track => {
                this.pc.addTrack(track, stream);
            });
            
            // Set up audio output
            this.pc.ontrack = (event) => {
                console.log('Received audio track from OpenAI');
                this.audioOutput.srcObject = event.streams[0];
                this.addMessage('🔊 AI voice connected', 'system');
            };
            
            // Create data channel for text messages (optional)
            this.dc = this.pc.createDataChannel('oai-events');
            this.dc.onopen = () => {
                console.log('Data channel opened');
                this.addMessage('📡 Data channel connected', 'system');
            };
            
            this.dc.onmessage = (event) => {
                console.log('Assistant message:', event.data);
                this.addMessage(`Assistant: ${event.data}`, 'assistant');
            };
            
            // Handle connection state changes
            this.pc.onconnectionstatechange = () => {
                console.log('Connection state:', this.pc.connectionState);
                if (this.pc.connectionState === 'connected') {
                    this.isConnected = true;
                    this.updateStatus('Connected - You can speak now!', 'connected');
                    this.stopBtn.disabled = false;
                    this.addMessage('🎤 Microphone active - start speaking!', 'system');
                } else if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
                    this.handleConnectionError('Connection failed');
                }
            };
            
            // Create SDP offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            
            // Send offer to OpenAI Realtime API
            const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            // Set remote description with the answer from OpenAI
            const answerSdp = await response.text();
            const answer = {
                type: 'answer',
                sdp: answerSdp
            };
            
            await this.pc.setRemoteDescription(answer);
            
            this.addMessage('🤖 AI assistant is ready to chat!', 'system');
            
        } catch (error) {
            console.error('Error starting conversation:', error);
            this.handleConnectionError(error.message);
        }
    }
    
    async stopConversation() {
        try {
            this.updateStatus('Disconnecting...', 'connecting');
            
            if (this.dc) {
                this.dc.close();
                this.dc = null;
            }
            
            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }
            
            // Stop all media tracks
            if (this.audioOutput.srcObject) {
                this.audioOutput.srcObject.getTracks().forEach(track => track.stop());
                this.audioOutput.srcObject = null;
            }
            
            this.isConnected = false;
            this.updateStatus('Disconnected', 'normal');
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            
            this.addMessage('🔌 Conversation ended', 'system');
            
        } catch (error) {
            console.error('Error stopping conversation:', error);
            this.handleConnectionError('Error disconnecting');
        }
    }
    
    handleConnectionError(errorMessage) {
        this.updateStatus(`Error: ${errorMessage}`, 'error');
        this.addMessage(`❌ Error: ${errorMessage}`, 'system');
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.isConnected = false;
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new OpenAIRealtimeChat();
    
    // Add some helpful information
    const messages = document.getElementById('messages');
    messages.innerHTML = `
        <p class="system-message">Welcome to OpenAI Real-time Voice Chat!</p>
        <p class="system-message">📝 Make sure to set your API key in script.js</p>
        <p class="system-message">🎤 Allow microphone access when prompted</p>
        <p class="system-message">🔊 Make sure your speakers/headphones are working</p>
        <p class="system-message">Click "Start Conversation" to begin!</p>
    `;
});