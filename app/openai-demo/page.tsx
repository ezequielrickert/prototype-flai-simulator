'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OpenAIChatbot } from '@/components/openai-chatbot';

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
          <h1 className="text-4xl font-bold mb-4">OpenAI Integration Demo</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Experimenta conversaciones con IA usando GPT-4 de OpenAI y síntesis de voz optimizada para español latinoamericano
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">OpenAI GPT-4</Badge>
            <Badge variant="secondary">Text-to-Speech</Badge>
            <Badge variant="secondary">Ethics Training</Badge>
            <Badge variant="secondary">Real-time Chat</Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎙️ Voice Input</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Usa reconocimiento de voz para comunicarte naturalmente con el asistente de IA
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔊 Audio Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recibe respuestas de IA con síntesis de voz natural optimizada para español latinoamericano
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🧠 Smart Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Impulsado por GPT-4 de OpenAI para respuestas inteligentes y contextualmente apropiadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="mb-8">
          <OpenAIChatbot scenario={scenario} />
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
                <Badge variant="outline">GPT-4</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Text-to-Speech:</span>
                <Badge variant="outline">OpenAI TTS</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Speech Recognition:</span>
                <Badge variant="outline">Browser WebAPI</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Idioma:</span>
                <Badge variant="outline">Español Latinoamericano</Badge>
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
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Entrada de Texto</h4>
                <p className="text-muted-foreground">
                  Escribe tus preguntas o comentarios en el área de texto y presiona Enviar o Enter.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Entrada de Voz</h4>
                <p className="text-muted-foreground">
                  Haz clic en el botón del micrófono para usar entrada de voz. Habla claramente en español.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Reproducción de Audio</h4>
                <p className="text-muted-foreground">
                  Haz clic en el ícono del altavoz junto a las respuestas de IA para escucharlas en voz alta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
