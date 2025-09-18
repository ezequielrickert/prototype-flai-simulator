'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealtimeChatInterface } from '@/components/realtime-chat-interface';

export default function OpenAIDemo() {
  const scenario = {
    title: "Ethics Training Scenario",
    description: "Practice handling ethical dilemmas in a corporate environment with AI assistance."
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">OpenAI Realtime Demo</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Experimenta conversaciones en tiempo real con IA usando la nueva API Realtime de OpenAI con audio streaming directo
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">OpenAI Realtime API</Badge>
            <Badge variant="secondary">WebRTC Audio</Badge>
            <Badge variant="secondary">Real-time Voice</Badge>
            <Badge variant="secondary">gpt-4o-realtime-preview</Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎙️ Real-time Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comunicación de voz bidireccional en tiempo real sin latencia usando WebRTC
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔊 Streaming Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Audio streaming directo desde la API Realtime de OpenAI sin procesamiento intermedio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🧠 Smart Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Impulsado por gpt-4o-realtime-preview para conversaciones naturales e interruptibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="mb-8">
          <RealtimeChatInterface />
        </div>

        {/* Technical Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 Technical Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">AI Model:</span>
                <Badge variant="outline">gpt-4o-realtime-preview</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Audio Technology:</span>
                <Badge variant="outline">WebRTC Streaming</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Connection:</span>
                <Badge variant="outline">Real-time Bidirectional</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Latencia:</span>
                <Badge variant="outline">Ultra-baja (&lt;100ms)</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Ethics and compliance training</li>
                <li>• Anti-corruption education</li>
                <li>• Corporate policy guidance</li>
                <li>• Interactive Q&A sessions</li>
                <li>• Scenario-based learning</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">📋 How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Conectar</h4>
                <p className="text-muted-foreground">
                  Haz clic en "Connect" para establecer una conexión WebRTC en tiempo real con la API de OpenAI.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Hablar</h4>
                <p className="text-muted-foreground">
                  Una vez conectado, simplemente habla. La IA escuchará y responderá en tiempo real sin retrasos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
