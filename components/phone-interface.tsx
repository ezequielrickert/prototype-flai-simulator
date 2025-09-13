"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
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
    SpeechRecognition: any
    webkitSpeechRecognition: any
    isSecureContext: boolean
    speechSynthesis: any
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
  const { toast } = useToast()

  const playBrowserSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-AR" // Específicamente argentino
      utterance.rate = 0.85 // Velocidad natural argentina
      utterance.pitch = 1.0 // Pitch neutro
      utterance.volume = 0.9

      const voices = speechSynthesis.getVoices()
      const argentineVoice = voices.find(
        (voice) =>
          (voice.lang.includes("es-AR") || voice.lang.includes("es-MX") || voice.lang.includes("es-CO")) &&
          (voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.name.includes("Natural")),
      )
      if (argentineVoice) {
        utterance.voice = argentineVoice
      }

      utterance.onstart = () => {
        console.log("[v0] Browser speech started")
        setIsAISpeaking(true)
      }

      utterance.onend = () => {
        console.log("[v0] Browser speech ended")
        setIsAISpeaking(false)
      }

      utterance.onerror = (error) => {
        console.error("[v0] Browser speech error:", error)
        setIsAISpeaking(false)
        toast({
          title: "Síntesis de voz no disponible",
          description: "La respuesta se muestra solo como texto.",
        })
      }

      speechSynthesis.speak(utterance)
    } else {
      setIsAISpeaking(false)
      toast({
        title: "Síntesis de voz no disponible",
        description: "Tu navegador no soporta síntesis de voz.",
      })
    }
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.isSecureContext) {
        toast({
          title: "Conexión no segura",
          description: "El reconocimiento de voz requiere HTTPS. Usa localhost o una conexión segura.",
          variant: "destructive",
        })
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        toast({
          title: "Navegador no compatible",
          description: "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.",
          variant: "destructive",
        })
        return
      }

      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = false // Mantener false para evitar errores de red
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "es-ES"
      recognitionInstance.maxAlternatives = 1

      // Agregar configuraciones adicionales para estabilidad
      if ("serviceURI" in recognitionInstance) {
        recognitionInstance.serviceURI = "wss://www.google.com/speech-api/v2/recognize"
      }

      let restartTimeout: NodeJS.Timeout | null = null
      let isManualStop = false
      let networkErrorCount = 0
      const MAX_NETWORK_ERRORS = 3

      recognitionInstance.onstart = () => {
        console.log("[v0] Speech recognition started")
        setIsListening(true)
        if (restartTimeout) {
          clearTimeout(restartTimeout)
          restartTimeout = null
        }
      }

      recognitionInstance.onend = () => {
        console.log("[v0] Speech recognition ended")
        setIsListening(false)

        if (isCallActive && !isMuted && !isManualStop && networkErrorCount < MAX_NETWORK_ERRORS) {
          restartTimeout = setTimeout(() => {
            if (isCallActive && !isMuted && !isManualStop) {
              try {
                console.log("[v0] Auto-restarting speech recognition")
                recognitionInstance.start()
              } catch (error) {
                console.log("[v0] Auto-restart failed:", error)
              }
            }
          }, 1500) // Aumentado de 500ms a 1500ms
        }
      }

      recognitionInstance.onresult = (event: any) => {
        console.log("[v0] Speech recognition result:", event)
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          console.log("[v0] Final transcript:", finalTranscript)
          // Add complete user message to transcript
          setTranscript((prev) => [
            ...prev.filter((msg) => !(msg.speaker === "user" && !msg.isComplete)),
            {
              speaker: "user",
              text: finalTranscript,
              timestamp: new Date(),
              isComplete: true,
            },
          ])

          // Generate AI response
          generateAIResponse(finalTranscript)
          setCurrentUserText("")
        } else if (interimTranscript) {
          // Update current user text (interim results)
          setCurrentUserText(interimTranscript)

          // Update or add interim transcript
          setTranscript((prev) => {
            const filtered = prev.filter((msg) => !(msg.speaker === "user" && !msg.isComplete))
            return [
              ...filtered,
              {
                speaker: "user",
                text: interimTranscript,
                timestamp: new Date(),
                isComplete: false,
              },
            ]
          })
        }
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        setIsListening(false)

        switch (event.error) {
          case "network":
            networkErrorCount++
            console.log(`[v0] Network error #${networkErrorCount}, attempting recovery...`)

            if (networkErrorCount >= MAX_NETWORK_ERRORS) {
              toast({
                title: "Problemas de conexión",
                description: "Reconocimiento automático deshabilitado. Usa el botón de micrófono para hablar.",
                variant: "destructive",
              })
              return
            }

            const delay = networkErrorCount * 2000 // 2s, 4s, 6s
            if (isCallActive && !isMuted && !isManualStop) {
              restartTimeout = setTimeout(() => {
                if (isCallActive && !isMuted && !isManualStop) {
                  try {
                    console.log(`[v0] Restarting after network error (attempt ${networkErrorCount})`)
                    recognitionInstance.start()
                  } catch (error) {
                    console.log("[v0] Network error restart failed:", error)
                  }
                }
              }, delay)
            }
            return

          case "not-allowed":
            toast({
              title: "Permisos denegados",
              description: "Permite el acceso al micrófono para usar esta función.",
              variant: "destructive",
            })
            break

          case "no-speech":
            if (isCallActive && !isMuted && !isManualStop && networkErrorCount < MAX_NETWORK_ERRORS) {
              restartTimeout = setTimeout(() => {
                if (isCallActive && !isMuted && !isManualStop) {
                  try {
                    recognitionInstance.start()
                  } catch (error) {
                    console.log("[v0] No-speech restart failed:", error)
                  }
                }
              }, 500)
            }
            return

          case "audio-capture":
            toast({
              title: "Error de micrófono",
              description: "No se pudo acceder al micrófono. Verifica que no esté siendo usado por otra aplicación.",
              variant: "destructive",
            })
            break

          case "service-not-allowed":
            toast({
              title: "Servicio no disponible",
              description: "El servicio de reconocimiento de voz no está disponible. Intenta recargar la página.",
              variant: "destructive",
            })
            break

          default:
            toast({
              title: "Error de reconocimiento",
              description: `Error: ${event.error}. Intenta de nuevo.`,
              variant: "destructive",
            })
        }
      }

      const cleanup = () => {
        isManualStop = true
        networkErrorCount = 0 // Reset contador al limpiar
        if (restartTimeout) {
          clearTimeout(restartTimeout)
          restartTimeout = null
        }
      }

      setRecognition({ instance: recognitionInstance, cleanup })
    }
  }, [isCallActive, isMuted])

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      console.log("[v0] Microphone permission granted")
      // Cerrar el stream inmediatamente ya que solo necesitamos los permisos
      stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      console.error("[v0] Microphone permission denied:", error)
      toast({
        title: "Permisos requeridos",
        description: "Necesitas permitir el acceso al micrófono para usar esta función.",
        variant: "destructive",
      })
      return
    }

    setIsCallActive(true)
    setIsListening(true)

    // Start with AI greeting
    const greeting = `¡Hola! Soy tu entrenador de ética empresarial. Hoy vamos a charlar sobre ${scenario.title}. Te cuento la situación: ${scenario.description} ¿Qué te parece? ¿Cómo encarías vos esta situación?`

    setTranscript([
      {
        speaker: "ai",
        text: greeting,
        timestamp: new Date(),
        isComplete: true,
      },
    ])

    // Start speech recognition
    if (recognition?.instance) {
      try {
        recognition.instance.start()
        console.log("[v0] Starting speech recognition")
      } catch (error) {
        console.error("[v0] Error starting recognition:", error)
        toast({
          title: "Error",
          description: "No se pudo iniciar el reconocimiento de voz.",
          variant: "destructive",
        })
      }
    }

    // Play AI greeting
    playAIResponse(greeting)
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsListening(false)

    if (recognition?.instance) {
      try {
        recognition.cleanup() // Limpiar timeouts primero
        recognition.instance.stop()
      } catch (error) {
        console.error("Error stopping recognition:", error)
      }
    }

    // Calculate score based on conversation
    const userMessages = transcript.filter((msg) => msg.speaker === "user" && msg.isComplete)
    const score = Math.min(100, userMessages.length * 15 + Math.random() * 25)

    onComplete(Math.round(score))
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (recognition?.instance) {
      try {
        if (isMuted) {
          recognition.instance.start()
          setIsListening(true)
        } else {
          recognition.cleanup() // Limpiar timeouts antes de parar
          recognition.instance.stop()
          setIsListening(false)
        }
      } catch (error) {
        console.error("Error toggling recognition:", error)
      }
    }
  }

  const generateAIResponse = async (userInput: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          scenario: scenario,
          conversationHistory: transcript.filter((msg) => msg.isComplete),
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const aiResponse = data.response

        setTranscript((prev) => [
          ...prev,
          {
            speaker: "ai",
            text: aiResponse,
            timestamp: new Date(),
            isComplete: true,
          },
        ])

        // Play AI response
        playAIResponse(aiResponse)
      } else {
        throw new Error("API response failed")
      }
    } catch (error) {
      console.error("[v0] Error generating AI response:", error)

      const fallbackResponses = [
        "Che, esa es una buena reflexión. ¿Qué te parece si profundizamos un poco más en esa idea?",
        "Está perfecto lo que decís. ¿Cómo manejarías la presión si alguien te pide hacer algo que no te parece correcto?",
        "Muy bien, veo que tenés clara la situación. ¿Qué harías para documentar tu decisión?",
        "Excelente análisis, pibe. ¿Cómo te asegurarías de que todos en el equipo entiendan tu posición?",
      ]

      const aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

      setTranscript((prev) => [
        ...prev,
        {
          speaker: "ai",
          text: aiResponse,
          timestamp: new Date(),
          isComplete: true,
        },
      ])

      playAIResponse(aiResponse)
    }
  }

  const playAIResponse = async (text: string) => {
    setIsAISpeaking(true)
    console.log("[v0] Playing AI response:", text)

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      console.log("[v0] TTS API response status:", response.status)
      const data = await response.json()
      console.log("[v0] TTS API response data:", data)

      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl)

        audio.onerror = (error) => {
          console.error("[v0] Audio playback error:", error)
          setIsAISpeaking(false)
          toast({
            title: "Error de reproducción",
            description: "No se pudo reproducir el audio de ElevenLabs.",
            variant: "destructive",
          })
        }

        audio.onended = () => {
          console.log("[v0] Audio playback ended")
          setIsAISpeaking(false)
        }

        await audio.play()
        console.log("[v0] Audio playback started")
      } else {
        console.log("[v0] ElevenLabs failed:", data.message)
        setIsAISpeaking(false)

        toast({
          title: "ElevenLabs Error",
          description: data.message || "Error de ElevenLabs. Verifica tu API key y suscripción.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error playing AI response:", error)
      setIsAISpeaking(false)
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con ElevenLabs. Verifica tu conexión.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Call Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isCallActive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-white font-medium">{isCallActive ? "Llamada en curso" : "Llamada terminada"}</span>
            {isCallActive && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{scenario.title}</h1>
          <p className="text-blue-200">Conversación telefónica con IA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phone Interface */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-white">Control de Llamada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Button */}
                <div className="text-center">
                  {!isCallActive ? (
                    <Button
                      onClick={startCall}
                      className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Phone className="w-8 h-8" />
                    </Button>
                  ) : (
                    <Button onClick={endCall} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white">
                      <PhoneOff className="w-8 h-8" />
                    </Button>
                  )}
                </div>

                {/* Call Controls */}
                {isCallActive && (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      className={`w-12 h-12 rounded-full border-white/30 ${
                        isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white"
                      }`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-12 h-12 rounded-full border-white/30 bg-white/10 text-white"
                      disabled
                    >
                      {isAISpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="space-y-3 text-center">
                  {isCallActive && (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isListening ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                        />
                        <span className="text-sm">{isListening ? "Escuchando..." : "Silenciado"}</span>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isAISpeaking ? "bg-blue-400 animate-pulse" : "bg-gray-400"}`}
                        />
                        <span className="text-sm">{isAISpeaking ? "IA hablando..." : "IA en silencio"}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress */}
                {isCallActive && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{Math.round(((300 - timeRemaining) / 300) * 100)}%</span>
                    </div>
                    <Progress value={((300 - timeRemaining) / 300) * 100} className="bg-white/20" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Transcript */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Transcripción en Tiempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {transcript.map((message, index) => (
                    <div key={index} className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.speaker === "user"
                            ? message.isComplete
                              ? "bg-blue-600 text-white"
                              : "bg-blue-600/50 text-blue-100 italic"
                            : "bg-white/20 text-white border border-white/30"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs opacity-70 mt-1">{message.speaker === "user" ? "Tú" : "IA"}</span>
                          <div className="flex-1">
                            <p className={message.isComplete ? "" : "opacity-75"}>
                              {message.text}
                              {!message.isComplete && message.speaker === "user" && (
                                <span className="animate-pulse">|</span>
                              )}
                            </p>
                            <span className="text-xs opacity-50">{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current user speech (interim) */}
                  {currentUserText && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] p-3 rounded-lg bg-blue-600/30 text-blue-100 italic border border-blue-400/50">
                        <div className="flex items-start gap-2">
                          <span className="text-xs opacity-70 mt-1">Tú</span>
                          <div className="flex-1">
                            <p className="opacity-75">
                              {currentUserText}
                              <span className="animate-pulse">|</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {!isCallActive && (
                  <div className="text-center text-white/70 space-y-2">
                    <p>Presiona el botón verde para iniciar la llamada</p>
                    <p className="text-sm">La conversación será transcrita en tiempo real</p>
                  </div>
                )}

                {isCallActive && (
                  <div className="text-center text-white/70 space-y-2">
                    <p className="text-sm">
                      {isListening ? "Habla naturalmente, tu voz está siendo transcrita" : "Micrófono silenciado"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
