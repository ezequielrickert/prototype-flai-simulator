"use client";

import { ElevenLabsChatbot } from "@/components/elevenlabs-chatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ElevenLabsDemo() {
  const demoScenario = {
    title: "Decisión sobre Soborno Empresarial",
    description: "Un cliente importante está ofreciendo un contrato millonario a cambio de ciertos 'favores' que podrían comprometer la integridad de tu empresa."
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">ElevenLabs AI Assistant Demo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interact with our ethics training AI assistant powered by ElevenLabs. 
              Ask questions about business ethics, anti-corruption practices, and ethical decision-making.
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary">Voice AI</Badge>
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
                  Use speech-to-text to communicate naturally with the AI assistant
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔊 Audio Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Receive AI responses with natural-sounding voice synthesis
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧠 Ethics Expert</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specialized AI trained in business ethics and anti-corruption practices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chatbot Interface */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Scenario Info */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Scenario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Title:</h4>
                    <p className="text-sm text-muted-foreground">{demoScenario.title}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Description:</h4>
                    <p className="text-sm text-muted-foreground">{demoScenario.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Type your question or use the microphone</p>
                  <p>• Ask about ethical implications</p>
                  <p>• Request guidance on decision-making</p>
                  <p>• Play audio responses for natural interaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Chatbot */}
            <div className="lg:col-span-3">
              <ElevenLabsChatbot 
                scenario={demoScenario}
                className="h-[600px]"
              />
            </div>
          </div>

          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>API Key:</strong> Configured ✅</p>
                  <p><strong>Agent ID:</strong> {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''}</p>
                </div>
                <div>
                  <p><strong>Voice Recognition:</strong> Browser-based</p>
                  <p><strong>Speech Language:</strong> Spanish (Argentina)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
