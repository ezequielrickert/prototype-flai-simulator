"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PhoneInterfaceProps {
  onComplete: (score: number) => void
  level: number
  scenario: {
    title: string
    description: string
    aiPrompt: string
  }
}

interface TranscriptMessage {
  speaker: "user" | "ai"
  text: string
  timestamp: Date
  isComplete: boolean
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
    isSecureContext: boolean
  }
}

export function PhoneInterface({ onComplete, level, scenario }: PhoneInterfaceProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [currentUserText, setCurrentUserText] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [recognition, setRecognition] = useState<any>(null)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'es-AR'

        recognitionInstance.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setCurrentUserText(finalTranscript)
            handleUserSpeechComplete(finalTranscript)
          } else {
            setCurrentUserText(interimTranscript)
          }
        }

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          toast({
            title: "Error de reconocimiento de voz",
            description: "No se pudo procesar tu voz. Intenta de nuevo.",
            variant: "destructive"
          })
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (isCallActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endCall()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isCallActive, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startCall = async () => {
    setIsCallActive(true)
    toast({
      title: "Llamada iniciada",
      description: "¡Conversación comenzada! Habla cuando veas el micrófono activo.",
    })

    // Inicio automático de la conversación con el saludo
    setTimeout(() => {
      sendInitialMessage()
    }, 1000)
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsListening(false)
    if (recognition) {
      recognition.stop()
    }
    if (speechSynthesis) {
      speechSynthesis.cancel()
    }
    calculateAndComplete()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      stopListening()
    }
  }

  const startListening = () => {
    if (recognition && !isListening && !isMuted && !isAISpeaking) {
      setIsListening(true)
      setCurrentUserText("")
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const sendInitialMessage = async () => {
    const initialMessage = `Hola, soy tu entrenador de ética. Hoy vamos a trabajar con este escenario: ${scenario.description}. ¿Me podrías contar cuál sería tu primera reacción ante esta situación?`

    await sendMessageToAI(initialMessage, true)
  }

  const handleUserSpeechComplete = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    // Agregar mensaje del usuario al transcript
    const userTranscript: TranscriptMessage = {
      speaker: "user",
      text: userMessage,
      timestamp: new Date(),
      isComplete: true
    }

    setTranscript(prev => [...prev, userTranscript])
    setCurrentUserText("")
    stopListening()

    // Enviar a la API y obtener respuesta
    await sendMessageToAI(userMessage, false)
  }

  const sendMessageToAI = async (message: string, isInitial: boolean = false) => {
    setIsLoading(true)
    setIsAISpeaking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          scenario: scenario,
          conversationHistory: transcript,
          sessionId: sessionId
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const aiMessage = data.response

        // Agregar respuesta de la IA al transcript
        const aiTranscript: TranscriptMessage = {
          speaker: "ai",
          text: aiMessage,
          timestamp: new Date(),
          isComplete: true
        }

        if (!isInitial) {
          setTranscript(prev => [...prev, aiTranscript])
        } else {
          setTranscript([aiTranscript])
        }

        // Convertir texto a voz y reproducir
        await speakText(aiMessage)
      } else {
        throw new Error(data.error || 'Error en la respuesta de la API')
      }
    } catch (error) {
      console.error('Error sending message to AI:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo comunicar con la IA. Intenta de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-AR'
        utterance.rate = 0.9
        utterance.pitch = 1

        utterance.onend = () => {
          setIsAISpeaking(false)
          // Iniciar escucha automáticamente después de que la IA termine
          setTimeout(() => {
            if (isCallActive) {
              startListening()
            }
          }, 500)
          resolve()
        }

        utterance.onerror = () => {
          setIsAISpeaking(false)
          resolve()
        }

        speechSynthesis.speak(utterance)
      } else {
        setIsAISpeaking(false)
        resolve()
      }
    })
  }

  const calculateAndComplete = () => {
    // Calcular puntaje basado en la duración y calidad de la conversación
    const conversationLength = transcript.filter(t => t.speaker === "user").length
    const timeUsed = 300 - timeRemaining
    const engagementScore = Math.min(100, (conversationLength * 10) + (timeUsed / 3))

    const finalScore = Math.max(60, Math.min(100, engagementScore))
    onComplete(Math.round(finalScore))
  }

  if (!isCallActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Conversación Telefónica</CardTitle>
              <CardDescription className="text-lg">{scenario.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Escenario:</h3>
                <p className="text-blue-800 dark:text-blue-200">{scenario.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Instrucciones:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    La conversación será por voz (micrófono y altavoces)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Habla claramente cuando veas el micrófono activo
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    La IA te guiará a través de preguntas éticas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Tienes 5 minutos para la conversación completa
                  </li>
                </ul>
              </div>

              <Button
                onClick={startCall}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Iniciar Llamada
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header with call info and timer */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-300 text-green-700">
              Llamada Activa
            </Badge>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              {scenario.title}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatTime(timeRemaining)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">tiempo restante</div>
            </div>
            <Progress value={((300 - timeRemaining) / 300) * 100} className="w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phone Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Conversación en Curso
                  </span>
                  <div className="flex items-center gap-2">
                    {isAISpeaking && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Volume2 className="w-3 h-3 mr-1" />
                        IA Hablando
                      </Badge>
                    )}
                    {isListening && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Mic className="w-3 h-3 mr-1" />
                        Escuchando
                      </Badge>
                    )}
                    {isLoading && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Procesando...
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Transcript */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {transcript.map((message, index) => (
                    <div key={index} className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.speaker === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border"
                        }`}
                      >
                        <div className="mb-1">{message.text}</div>
                        <div className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentUserText && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] p-3 rounded-lg bg-blue-400 text-white opacity-70">
                        <div>{currentUserText}</div>
                        <div className="text-xs">Escribiendo...</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call Controls */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>

                  <Button
                    onClick={endCall}
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with tips and status */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de la Llamada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-3 rounded-lg ${isCallActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <p className="text-sm font-medium">
                    {isCallActive ? '🟢 Llamada Activa' : '⚪ Llamada Inactiva'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isListening ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <p className="text-sm font-medium">
                    {isListening ? '🎤 Escuchando' : '🔇 No escuchando'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isAISpeaking ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <p className="text-sm font-medium">
                    {isAISpeaking ? '🔊 IA Hablando' : '🔇 IA Silenciosa'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">💡 Habla claramente y despacio</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">🎯 Espera a que termine la IA</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">⚖️ Explica tu razonamiento</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">🔊 Ajusta el volumen si es necesario</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Intercambios</span>
                    <span>{transcript.filter(t => t.speaker === "user").length}/10</span>
                  </div>
                  <Progress value={(transcript.filter(t => t.speaker === "user").length / 10) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
