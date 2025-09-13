"use client"

import { useState, useEffect, useRef } from "react"
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
  const [isAIThinking, setIsAIThinking] = useState(false) // Nuevo estado para cuando IA está pensando
  const [micBlockedByAI, setMicBlockedByAI] = useState(false) // Nuevo estado para bloqueo por IA
  const micBlockedByAIRef = useRef(false) // Ref para acceso en callbacks
  const transcriptContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Sincronizar ref con estado
  useEffect(() => {
    micBlockedByAIRef.current = micBlockedByAI
  }, [micBlockedByAI])

  // Función auxiliar para debuggear el estado del micrófono
  const logMicrophoneState = (context: string) => {
    console.log(`[v0] ${context} - Estados del micrófono:`, {
      isCallActive,
      isMuted,
      isListening,
      isAISpeaking,
      micBlockedByAI,
      recognitionExists: !!recognition?.instance
    })
  }

  // Funciones para controlar el micrófono durante el habla de la IA
  const pauseMicForAI = () => {
    console.log("[v0] Pausando micrófono - IA va a hablar")
    setMicBlockedByAI(true)
    if (recognition?.instance && isListening && !isMuted) {
      try {
        recognition.cleanup() // Limpiar timeouts
        recognition.instance.stop()
        setIsListening(false)
      } catch (error) {
        console.error("Error pausando reconocimiento para IA:", error)
      }
    } else {
      // Si el reconocimiento no estaba activo, solo marcamos como bloqueado
      setIsListening(false)
      console.log("[v0] Micrófono marcado como bloqueado (no estaba activo)")
    }
  }

  const resumeMicAfterAI = () => {
    console.log("[v0] IA terminó de hablar - iniciando proceso de reactivación del micrófono")
    logMicrophoneState("IA terminó de hablar")
    
    // Primero, siempre desbloquear el micrófono de la IA
    setMicBlockedByAI(false)
    
    // Solo reanudar el micrófono si la llamada está activa y NO está silenciado manualmente
    if (recognition?.instance && isCallActive && !isMuted) {
      // Aumentado el delay para asegurar que el audio terminó completamente
      setTimeout(() => {
        // Verificar nuevamente las condiciones antes de reanudar (pueden haber cambiado)
        if (!isCallActive) {
          console.log("[v0] Llamada ya no está activa, no se reanuda micrófono")
          return
        }
        
        if (isMuted) {
          console.log("[v0] Usuario silenció manualmente, no se reanuda micrófono")
          return
        }
        
        if (micBlockedByAI) {
          console.log("[v0] IA aún está hablando, no se reanuda micrófono")
          return
        }

        console.log("[v0] Intentando reanudar micrófono...")
        logMicrophoneState("Intentando reanudar micrófono")
        
        try {
          // Limpiar cualquier timeout de auto-reinicio pendiente
          if (recognition.cleanup) {
            recognition.cleanup()
          }
          
          // Verificar si el reconocimiento ya está activo
          if (isListening) {
            console.log("[v0] El reconocimiento ya está activo, no es necesario reiniciar")
            return
          }
          
          // Intentar iniciar el reconocimiento
          recognition.instance.start()
          setIsListening(true)
          console.log("[v0] ✅ Micrófono reanudado exitosamente después de IA")
          logMicrophoneState("Micrófono reanudado exitosamente")
          
        } catch (error) {
          console.error("[v0] ❌ Error reanudando reconocimiento después de IA:", error)
          
          // Si el error es "already-started", no es realmente un error
          if (error instanceof Error && error.message.includes("already started")) {
            console.log("[v0] ✅ Recognition already started, setting listening to true")
            setIsListening(true)
            return
          }
          
          // Si hay error, intentar de nuevo en un momento
          console.log("[v0] Intentando segunda vez en 1 segundo...")
          setTimeout(() => {
            try {
              if (isCallActive && !isMuted && !micBlockedByAI) {
                recognition.instance.start()
                setIsListening(true)
                console.log("[v0] ✅ Segundo intento de reanudar micrófono exitoso")
              } else {
                console.log("[v0] Condiciones cambiaron durante segundo intento")
              }
            } catch (retryError) {
              console.error("[v0] ❌ Error en segundo intento de reanudar:", retryError)
              toast({
                title: "Error de micrófono",
                description: "No se pudo reactivar el micrófono automáticamente. Puedes intentar silenciar y activar manualmente.",
                variant: "destructive",
              })
            }
          }, 1000)
        }
      }, 1500) // Reducido de 2 segundos a 1.5 para mayor responsividad
    } else {
      console.log("[v0] No se reanuda micrófono - condiciones no cumplidas:", {
        hasRecognition: !!recognition?.instance,
        isCallActive,
        isMuted
      })
      logMicrophoneState("Condiciones no cumplidas para reanudar")
    }
  }

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    if (transcriptContainerRef.current) {
      const container = transcriptContainerRef.current
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }

  // Auto-scroll when transcript updates
  useEffect(() => {
    scrollToBottom()
  }, [transcript, currentUserText])

  // Additional scroll when component mounts or call starts
  useEffect(() => {
    if (isCallActive && transcriptContainerRef.current) {
      scrollToBottom()
    }
  }, [isCallActive])

  const playBrowserSpeech = (text: string) => {
    console.log("[v0] Starting browser speech synthesis")
    
    if ("speechSynthesis" in window) {
      // Cancelar cualquier síntesis anterior
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
        console.log("[v0] Browser speech synthesis started")
        // Asegurar que el estado esté correcto cuando empieza el browser speech
        if (!isAISpeaking) {
          setIsAISpeaking(true)
          pauseMicForAI()
        }
      }

      utterance.onend = () => {
        console.log("[v0] Browser speech synthesis ended")
        setIsAISpeaking(false)
        resumeMicAfterAI() // Reanudar micrófono cuando termine la síntesis
      }

      utterance.onerror = (error) => {
        console.error("[v0] Browser speech synthesis error:", error)
        setIsAISpeaking(false)
        resumeMicAfterAI() // Reanudar micrófono en caso de error
        toast({
          title: "Error de síntesis de voz",
          description: "Error en la síntesis del navegador. El micrófono se ha reactivado.",
          variant: "destructive",
        })
      }

      // Agregar timeout de seguridad en caso de que los eventos no se disparen
      const safetyTimeout = setTimeout(() => {
        console.log("[v0] Safety timeout - ensuring AI speaking state is reset")
        if (isAISpeaking) {
          setIsAISpeaking(false)
          resumeMicAfterAI()
        }
      }, 15000) // 15 segundos de timeout

      utterance.onend = () => {
        console.log("[v0] Browser speech synthesis ended")
        clearTimeout(safetyTimeout)
        setIsAISpeaking(false)
        resumeMicAfterAI()
      }

      utterance.onerror = (error) => {
        console.error("[v0] Browser speech synthesis error:", error)
        clearTimeout(safetyTimeout)
        setIsAISpeaking(false)
        resumeMicAfterAI()
        toast({
          title: "Error de síntesis de voz",
          description: "Error en la síntesis del navegador. El micrófono se ha reactivado.",
          variant: "destructive",
        })
      }

      speechSynthesis.speak(utterance)
      console.log("[v0] Browser speech synthesis initiated")
    } else {
      console.log("[v0] Speech synthesis not available")
      setIsAISpeaking(false)
      resumeMicAfterAI() // Reanudar micrófono si no hay síntesis de voz
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

      // Configuraciones mejoradas para reducir errores de red
      if ("grammars" in recognitionInstance) {
        recognitionInstance.grammars = new (window as any).webkitSpeechGrammarList()
      }

      let restartTimeout: NodeJS.Timeout | null = null
      let isManualStop = false
      let networkErrorCount = 0
      const MAX_NETWORK_ERRORS = 5 // Aumentado de 3 a 5

      recognitionInstance.onstart = () => {
        console.log("[v0] Speech recognition started")
        setIsListening(true)
        if (restartTimeout) {
          clearTimeout(restartTimeout)
          restartTimeout = null
        }
      }

      recognitionInstance.onend = () => {
        console.log("[v0] Speech recognition ended, micBlockedByAI:", micBlockedByAI, "isMuted:", isMuted, "isManualStop:", isManualStop)
        setIsListening(false)

        // No reiniciar si está bloqueado por IA, silenciado, o si hay muchos errores de red
        // Pero solo auto-reiniciar si NO está bloqueado por IA (para evitar conflicto con resumeMicAfterAI)
        if (isCallActive && !isMuted && !isManualStop && !micBlockedByAIRef.current && networkErrorCount < MAX_NETWORK_ERRORS) {
          restartTimeout = setTimeout(() => {
            if (isCallActive && !isMuted && !isManualStop && !micBlockedByAIRef.current) {
              try {
                console.log("[v0] Auto-restarting speech recognition")
                recognitionInstance.start()
              } catch (error) {
                console.log("[v0] Auto-restart failed:", error)
                // Si falla el reinicio automático, incrementar contador de errores
                networkErrorCount++
              }
            }
          }, 2000) // Aumentado a 2000ms para mayor estabilidad
        } else {
          console.log("[v0] Not auto-restarting recognition - blocked by conditions")
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
                title: "Problemas de conexión persistentes",
                description: "El reconocimiento automático está deshabilitado. Puedes continuar usando el botón de micrófono manualmente o recargar la página.",
                variant: "destructive",
              })
              // Reset del contador después de mostrar el mensaje final
              networkErrorCount = 0
              return
            }

            // Delay progresivo más agresivo para recuperación
            const delay = Math.min(networkErrorCount * 3000, 15000) // 3s, 6s, 9s, 12s, 15s max
            if (isCallActive && !isMuted && !isManualStop) {
              toast({
                title: `Problema de conexión (${networkErrorCount}/${MAX_NETWORK_ERRORS})`,
                description: `Reintentando en ${delay/1000} segundos...`,
                variant: "default",
              })
              
              restartTimeout = setTimeout(() => {
                if (isCallActive && !isMuted && !isManualStop) {
                  try {
                    console.log(`[v0] Restarting after network error (attempt ${networkErrorCount})`)
                    recognitionInstance.start()
                  } catch (error) {
                    console.log("[v0] Network error restart failed:", error)
                    networkErrorCount++
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

  // Auto-start listening when conditions are right
  useEffect(() => {
    if (recognition?.instance && isCallActive && !isMuted && !micBlockedByAI && !isAIThinking && !isListening) {
      console.log("[v0] Auto-activating microphone - conditions are right")
      try {
        recognition.instance.start()
        setIsListening(true)
        console.log("[v0] ✅ Microphone auto-activated successfully")
      } catch (error) {
        console.error("[v0] Error auto-starting recognition:", error)
        if (error instanceof Error && error.message.includes("already started")) {
          setIsListening(true)
        }
      }
    }
  }, [recognition, isCallActive, isMuted, micBlockedByAI, isAIThinking, isListening])

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
    
    // Start with AI greeting
    const greeting = `¡Hola! Soy tu entrenador de ética empresarial. Hoy vamos a charlar sobre ${scenario.title}. Te cuento la situación: ${scenario.description} ¿Qué te parece? ¿Cómo encararías vos esta situación?`

    setTranscript([
      {
        speaker: "ai",
        text: greeting,
        timestamp: new Date(),
        isComplete: true,
      },
    ])

    // Bloquear micrófono solo mientras la IA va a hablar
    setMicBlockedByAI(true)
    setIsListening(false)
    
    console.log("[v0] Call started, AI will speak first")

    // Play AI greeting - esto iniciará el reconocimiento cuando termine
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
    const newMutedState = !isMuted
    logMicrophoneState(`Toggle mute: ${isMuted} -> ${newMutedState}`)
    setIsMuted(newMutedState)
    
    if (recognition?.instance) {
      try {
        if (newMutedState) {
          // Si se está silenciando, parar el reconocimiento
          recognition.cleanup() // Limpiar timeouts antes de parar
          recognition.instance.stop()
          setIsListening(false)
          console.log("[v0] Micrófono silenciado manualmente")
        } else {
          // Si se está desilenciando, iniciar el reconocimiento solo si no está bloqueado por IA
          if (!micBlockedByAI && isCallActive) {
            try {
              recognition.instance.start()
              setIsListening(true)
              console.log("[v0] Micrófono activado manualmente")
            } catch (startError) {
              console.error("Error iniciando reconocimiento al activar:", startError)
              if (startError instanceof Error && startError.message.includes("already started")) {
                setIsListening(true)
              }
            }
          } else {
            console.log("[v0] No se puede activar micrófono - IA está hablando o llamada no activa")
            // Si la IA no está hablando pero no podemos activar, mostrar el estado correcto
            if (!micBlockedByAI) {
              setIsListening(false)
            }
          }
        }
        logMicrophoneState("Después de toggle mute")
      } catch (error) {
        console.error("Error toggling recognition:", error)
      }
    }
  }

  // Función para reiniciar completamente el reconocimiento de voz
  const resetSpeechRecognition = () => {
    console.log("[v0] Resetting speech recognition...")
    
    // Parar y limpiar el reconocimiento actual
    if (recognition?.instance) {
      try {
        recognition.cleanup()
        recognition.instance.stop()
      } catch (error) {
        console.error("Error stopping recognition:", error)
      }
    }

    // Reinicializar el reconocimiento
    setTimeout(() => {
      if (isCallActive && !isMuted) {
        try {
          if (recognition?.instance) {
            recognition.instance.start()
            setIsListening(true)
            toast({
              title: "Reconocimiento reiniciado",
              description: "El reconocimiento de voz se ha reiniciado correctamente.",
            })
          }
        } catch (error) {
          console.error("Error restarting recognition:", error)
          toast({
            title: "Error al reiniciar",
            description: "No se pudo reiniciar el reconocimiento. Intenta recargar la página.",
            variant: "destructive",
          })
        }
      }
    }, 1000)
  }

  const generateAIResponse = async (userInput: string) => {
    console.log("[v0] User finished speaking, preparing AI response...")
    
    // Mostrar que la IA está "pensando" y bloquear micrófono
    setIsAIThinking(true)
    setMicBlockedByAI(true)
    setIsListening(false)
    
    // Agregar un delay para que el usuario vea la transición Verde → Naranja
    await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5 segundos de delay
    
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

        // Terminar el estado de "pensando" antes de hablar
        setIsAIThinking(false)
        
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

      // Terminar el estado de "pensando" antes de hablar
      setIsAIThinking(false)
      
      playAIResponse(aiResponse)
    }
  }

  const playAIResponse = async (text: string) => {
    console.log("[v0] Starting AI response playback")
    setIsAISpeaking(true)
    pauseMicForAI() // Pausar micrófono cuando IA va a hablar
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
        console.log("[v0] Using ElevenLabs audio")
        const audio = new Audio(data.audioUrl)

        audio.onerror = (error) => {
          console.error("[v0] ElevenLabs audio playback error:", error)
          setIsAISpeaking(false)
          resumeMicAfterAI() // Reanudar micrófono en caso de error
          toast({
            title: "Error de reproducción",
            description: "Error con ElevenLabs. El micrófono se ha reactivado.",
            variant: "destructive",
          })
        }

        audio.onended = () => {
          console.log("[v0] ElevenLabs audio playback ended")
          setIsAISpeaking(false)
          resumeMicAfterAI() // Reanudar micrófono cuando termine el audio
        }

        // Asegurar que el audio se cargue antes de reproducir
        audio.oncanplaythrough = () => {
          console.log("[v0] ElevenLabs audio ready to play")
        }

        await audio.play()
        console.log("[v0] ElevenLabs audio playback started")
      } else {
        console.log("[v0] ElevenLabs failed:", data.message)
        console.log("[v0] Falling back to browser speech synthesis")
        
        // Usar browser speech como fallback
        // playBrowserSpeech maneja su propio ciclo de inicio/fin de IA
        playBrowserSpeech(text)

        toast({
          title: "ElevenLabs Error",
          description: data.message || "Error de ElevenLabs. Usando síntesis del navegador.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("[v0] Error connecting to TTS API:", error)
      console.log("[v0] Falling back to browser speech synthesis due to connection error")
      
      // Usar browser speech como fallback en caso de error de conexión
      playBrowserSpeech(text)
      
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con ElevenLabs. Usando síntesis del navegador.",
        variant: "default",
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
          <div className="lg:col-span-1 order-2 lg:order-1">
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
                        isMuted 
                          ? "bg-red-500/20 text-red-400" 
                          : micBlockedByAI 
                            ? "bg-orange-500/20 text-orange-400 animate-pulse"
                            : isListening 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-white/10 text-white"
                      }`}
                      title={
                        isMuted 
                          ? "Micrófono silenciado (clic para activar)"
                          : micBlockedByAI 
                            ? "Micrófono bloqueado - IA está hablando"
                            : isListening 
                              ? "Micrófono activo (clic para silenciar)"
                              : "Micrófono inactivo (clic para activar)"
                      }
                    >
                      {isMuted || micBlockedByAI || !isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className={`w-12 h-12 rounded-full border-white/30 ${
                        isAISpeaking 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "bg-white/10 text-white"
                      }`}
                      disabled
                      title={isAISpeaking ? "IA está hablando" : "IA silenciosa"}
                    >
                      {isAISpeaking ? (
                        <Volume2 className="w-5 h-5 animate-pulse" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </Button>

                    <Button
                      onClick={resetSpeechRecognition}
                      variant="outline"
                      className="w-12 h-12 rounded-full border-white/30 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                      title="Reiniciar reconocimiento de voz"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                  </div>
                )}

                {/* Status Indicator - visible siempre durante la llamada */}
                {isCallActive && (
                  <div className="text-center">
                    <div className="text-sm text-gray-300">
                      {isAISpeaking ? (
                        <span className="flex items-center justify-center gap-2 text-blue-300">
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          IA está hablando...
                        </span>
                      ) : isAIThinking ? (
                        <span className="flex items-center justify-center gap-2 text-yellow-300">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          IA está pensando...
                        </span>
                      ) : micBlockedByAI ? (
                        <span className="flex items-center justify-center gap-2 text-orange-300">
                          <MicOff className="w-4 h-4" />
                          Esperando que termine IA...
                        </span>
                      ) : isMuted ? (
                        <span className="flex items-center justify-center gap-2 text-red-300">
                          <MicOff className="w-4 h-4" />
                          Micrófono silenciado
                        </span>
                      ) : isListening ? (
                        <span className="flex items-center justify-center gap-2 text-green-300">
                          <Mic className="w-4 h-4" />
                          Escuchando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 text-gray-400">
                          <MicOff className="w-4 h-4" />
                          Micrófono inactivo
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-3 text-center">
                  {isCallActive && (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            micBlockedByAI 
                              ? "bg-orange-400 animate-pulse" 
                              : isListening 
                                ? "bg-green-400 animate-pulse" 
                                : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm">
                          {micBlockedByAI 
                            ? "Mic bloqueado (IA hablando)" 
                            : isListening 
                              ? "Escuchando..." 
                              : "Silenciado"
                          }
                        </span>
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
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-[500px] lg:h-[600px] flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Transcripción en Tiempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-3 lg:p-4">
                <div 
                  ref={transcriptContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  style={{ 
                    scrollBehavior: 'smooth',
                    maxHeight: '100%'
                  }}
                >
                  {transcript.map((message, index) => (
                    <div key={index} className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"} w-full`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg break-words word-wrap overflow-hidden ${
                          message.speaker === "user"
                            ? message.isComplete
                              ? "bg-blue-600 text-white"
                              : "bg-blue-600/50 text-blue-100 italic"
                            : "bg-white/20 text-white border border-white/30"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs opacity-70 mt-1 flex-shrink-0">{message.speaker === "user" ? "Tú" : "IA"}</span>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className={`${message.isComplete ? "" : "opacity-75"} whitespace-pre-wrap break-words overflow-wrap-anywhere text-sm lg:text-base`}>
                              {message.text}
                              {!message.isComplete && message.speaker === "user" && (
                                <span className="animate-pulse">|</span>
                              )}
                            </p>
                            <span className="text-xs opacity-50 block mt-1">{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current user speech (interim) */}
                  {currentUserText && (
                    <div className="flex justify-end w-full">
                      <div className="max-w-[85%] sm:max-w-[80%] p-3 rounded-lg bg-blue-600/30 text-blue-100 italic border border-blue-400/50 break-words word-wrap overflow-hidden">
                        <div className="flex items-start gap-2">
                          <span className="text-xs opacity-70 mt-1 flex-shrink-0">Tú</span>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="opacity-75 whitespace-pre-wrap break-words overflow-wrap-anywhere text-sm lg:text-base">
                              {currentUserText}
                              <span className="animate-pulse">|</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions - Fixed at bottom */}
                <div className="flex-shrink-0 mt-3 lg:mt-4 pt-3 border-t border-white/10">
                  {!isCallActive && (
                    <div className="text-center text-white/70 space-y-2">
                      <p className="text-sm lg:text-base">Presiona el botón verde para iniciar la llamada</p>
                      <p className="text-xs lg:text-sm">La conversación será transcrita en tiempo real</p>
                    </div>
                  )}

                  {isCallActive && (
                    <div className="text-center text-white/70 space-y-2">
                      <p className="text-xs lg:text-sm">
                        {micBlockedByAI 
                          ? "El micrófono se pausa automáticamente mientras la IA habla" 
                          : isListening 
                            ? "Habla naturalmente, tu voz está siendo transcrita" 
                            : "Micrófono silenciado"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
