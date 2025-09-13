"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Volume2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { VoicePlayer } from "@/components/voice-player"
import { PhoneInterface } from "@/components/phone-interface"

interface DailyQuizProps {
  onComplete: (score: number) => void
  level: number
}

interface QuizScenario {
  id: string
  title: string
  description: string
  aiPrompt: string
  expectedTopics: string[]
  difficulty: number
}

const scenarios: QuizScenario[] = [
  {
    id: "conflict-interest-1",
    title: "Conflicto de Interés Personal",
    description: "Tu empresa está evaluando proveedores y uno de ellos es propiedad de tu hermano.",
    aiPrompt:
      "Eres un empleado que debe evaluar proveedores. Tu hermano tiene una empresa que está participando en la licitación. ¿Cómo manejarías esta situación?",
    expectedTopics: ["transparencia", "recusación", "conflicto de interés", "ética"],
    difficulty: 1,
  },
  {
    id: "gift-policy-1",
    title: "Política de Regalos",
    description: "Un cliente importante te ofrece un regalo costoso por las fiestas navideñas.",
    aiPrompt: "Un cliente valioso te ofrece un regalo de $500 por Navidad. ¿Qué harías y por qué?",
    expectedTopics: ["política de regalos", "límites éticos", "transparencia", "reporte"],
    difficulty: 2,
  },
]

export function DailyQuiz({ onComplete, level }: DailyQuizProps) {
  const [currentScenario, setCurrentScenario] = useState<QuizScenario>(scenarios[0])
  const [isRecording, setIsRecording] = useState(false)
  const [conversation, setConversation] = useState<Array<{ role: "user" | "ai"; content: string }>>([])
  const [currentStep, setCurrentStep] = useState<"intro" | "conversation" | "feedback">("intro")
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [userInput, setUserInput] = useState("")
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{
    strengths: string[]
    improvements: string[]
    score: number
  } | null>(null)
  const [usePhoneInterface, setUsePhoneInterface] = useState(false)

  useEffect(() => {
    if (currentStep === "conversation" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCurrentStep("feedback")
            generateFeedback()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentStep, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startConversation = () => {
    setUsePhoneInterface(true)
  }

  const handleUserResponse = () => {
    if (!userInput.trim()) return

    const newConversation = [...conversation, { role: "user" as const, content: userInput }]

    // Simulate AI response based on user input
    const aiResponse = generateAIResponse(userInput)
    newConversation.push({ role: "ai", content: aiResponse })

    setConversation(newConversation)
    setUserInput("")

    // Check if conversation should end
    if (newConversation.length >= 8) {
      setCurrentStep("feedback")
      generateFeedback()
    }
  }

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "Interesante perspectiva. ¿Podrías explicar más sobre por qué elegirías ese enfoque?",
      "Esa es una buena consideración ética. ¿Qué políticas de la empresa crees que se aplicarían aquí?",
      "Me parece que estás pensando en las implicaciones correctas. ¿Cómo comunicarías esta decisión a las partes involucradas?",
      "Excelente punto sobre la transparencia. ¿Qué pasos específicos tomarías para documentar tu decisión?",
      "Veo que entiendes los riesgos. ¿Cómo te asegurarías de que tu decisión sea consistente con los valores de la empresa?",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const generateFeedback = () => {
    // Simulate feedback generation based on conversation
    const userResponses = conversation.filter((msg) => msg.role === "user")
    const topicsCovered = currentScenario.expectedTopics.filter((topic) =>
      userResponses.some((response) => response.content.toLowerCase().includes(topic.toLowerCase())),
    )

    const calculatedScore = Math.min(
      100,
      (topicsCovered.length / currentScenario.expectedTopics.length) * 100 + Math.random() * 20,
    )

    setScore(calculatedScore)
    setFeedback({
      strengths: [
        "Demostró comprensión de los principios éticos básicos",
        "Consideró múltiples perspectivas del problema",
        "Mostró disposición a seguir políticas corporativas",
      ],
      improvements: [
        "Podría profundizar más en las implicaciones legales",
        "Considerar el impacto a largo plazo de las decisiones",
        "Desarrollar estrategias de comunicación más específicas",
      ],
      score: calculatedScore,
    })
  }

  const handleComplete = () => {
    onComplete(Math.round(score))
  }

  if (usePhoneInterface) {
    return (
      <PhoneInterface
        onComplete={onComplete}
        level={level}
        scenario={{
          title: currentScenario.title,
          description: currentScenario.description,
          aiPrompt: currentScenario.aiPrompt,
        }}
      />
    )
  }

  if (currentStep === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">{currentScenario.title}</CardTitle>
              <CardDescription className="text-lg">Conversación con IA - 5 minutos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Escenario:</h3>
                <p className="text-blue-800 dark:text-blue-200">{currentScenario.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Instrucciones:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Tendrás una conversación de 5 minutos con la IA
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Explica tu razonamiento ético paso a paso
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Considera las políticas de la empresa y las mejores prácticas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Recibirás feedback inmediato al finalizar
                  </li>
                </ul>
              </div>

              {/* Custom button with guaranteed contrast */}
              <button
                onClick={startConversation}
                className="w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1e40af"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1d4ed8"
                }}
              >
                <Volume2 className="w-5 h-5" />
                Iniciar Conversación
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentStep === "conversation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header with timer */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                {currentScenario.title}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatTime(timeRemaining)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">tiempo restante</div>
              </div>
              <Progress value={((300 - timeRemaining) / 300) * 100} className="w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Area */}
            <div className="lg:col-span-2">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversación con IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {conversation.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <div className="mb-2">{message.content}</div>
                          {message.role === "ai" && (
                            <VoicePlayer
                              text={message.content}
                              className="mt-2"
                              autoPlay={index === conversation.length - 1}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleUserResponse()}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <Button onClick={handleUserResponse} disabled={!userInput.trim()}>
                      Enviar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with tips */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consejos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">💡 Explica tu razonamiento paso a paso</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">🎯 Considera múltiples perspectivas</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">⚖️ Piensa en las implicaciones éticas</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">🔊 Escucha las respuestas de la IA</p>
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
                      <span>{conversation.length}/8</span>
                    </div>
                    <Progress value={(conversation.length / 8) * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "feedback" && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">¡Sesión Completada!</CardTitle>
              <CardDescription>Has completado tu entrenamiento diario de ética</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {Math.round(feedback.score)}%
                </div>
                <p className="text-gray-600 dark:text-gray-400">Puntuación de la Sesión</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Fortalezas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Áreas de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feedback.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
                >
                  Completar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
