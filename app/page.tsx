"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Target, MessageCircle, Volume2, CheckCircle2, Lock, Unlock, TvMinimalPlay, User, Mic } from "lucide-react"
import { DailyQuiz } from "@/components/daily-quiz"
import { ProgressChart } from "@/components/progress-chart"
import { RealtimeChatInterface } from "@/components/realtime-chat-interface"

interface UserProgress {
  currentStreak: number
  totalDays: number
  level: number
  xp: number
  completedToday: boolean
  lastCompletedDate: string
}

export default function HomePage() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentStreak: 7,
    totalDays: 23,
    level: 3,
    xp: 1250,
    completedToday: false,
    lastCompletedDate: "2024-01-14",
  })

  const [showQuiz, setShowQuiz] = useState(false)
  const [showRealtimeChat, setShowRealtimeChat] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleStartQuiz = () => {
    setShowQuiz(true)
  }

  const handleStartRealtimeChat = () => {
    setShowRealtimeChat(true)
  }

  const handleQuizComplete = (score: number) => {
    setUserProgress((prev) => ({
      ...prev,
      completedToday: true,
      currentStreak: prev.currentStreak + 1,
      totalDays: prev.totalDays + 1,
      xp: prev.xp + score * 10,
      lastCompletedDate: new Date().toISOString().split("T")[0],
    }))
    setShowQuiz(false)
  }

  const xpToNextLevel = userProgress.level * 500 - (userProgress.xp % 500)
  const progressToNextLevel = ((userProgress.xp % 500) / 500) * 100

  if (showQuiz) {
    return <DailyQuiz onComplete={handleQuizComplete} level={userProgress.level} />
  }

  if (showRealtimeChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowRealtimeChat(false)}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OpenAI Real-time Voice Chat
            </h1>
            <p className="text-gray-600">
              Experience real-time voice conversation with AI using WebRTC
            </p>
          </div>
          <RealtimeChatInterface />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-1 flex items-center justify-center" style={{background: '#181716', boxShadow: '0 0 16px 4px rgba(212,175,55,0.25)'}}>
                <img src="/logo-integridai.png" alt="IntegridAI Logo" className="w-16 h-16 object-contain" style={{display: 'block'}} />
              </div>
              <div>
                <h1 className="header-title-dark">IntegridAI</h1>
                <p className="header-subtitle-dark">Capacitación Anti-Corrupción</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="badge-header-nivel flex items-center gap-2 text-lg px-4 py-2">
                <Trophy className="w-8 h-8 icon-gold mr-2" />
                Nivel {userProgress.level}
              </Badge>
              <a href="/perfil" title="Ver perfil">
                <User className="w-10 h-10 perfil-icon" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Real-time Chat Card */}
            <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Real-time Voice Chat</CardTitle>
                      <CardDescription>OpenAI Realtime API - Nueva tecnología</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Volume2 className="w-4 h-4 mr-1" />
                    Nuevo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      ✨ Conversación de Voz en Tiempo Real
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Experimenta la nueva tecnología de OpenAI Realtime API. Habla directamente con la IA usando
                      WebRTC para una comunicación instantánea y natural.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartRealtimeChat}
                    className="w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Iniciar Chat de Voz
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Daily Challenge Card */}
            <Card className="card-custom">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'var(--brown-dark-20)'}}>
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="card-title-gold flex items-center gap-2">
                        Desafío Diario
                      </CardTitle>
                      <CardDescription>Conversación con IA - 5 minutos</CardDescription>
                    </div>
                  </div>
                  {userProgress.completedToday ? (
                    <span className="chip">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Completado
                    </span>
                  ) : (
                    <span className="chip border-gold text-gold">
                      Pendiente
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {currentTime.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="p-4 card-brown-bg rounded-lg">
                    <h4 className="font-semibold mb-2" style={{color: 'var(--cream)'}}>
                      Tema de Hoy: Conflictos de Interés
                    </h4>
                    <p className="text-sm" style={{color: 'var(--cream)'}}>
                      Practica identificar y manejar situaciones donde tus intereses personales podrían entrar en
                      conflicto con tus responsabilidades profesionales.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartQuiz}
                    disabled={userProgress.completedToday}
                    className={`button-beige h-12 w-full font-bold py-3 rounded-lg transition-all duration-200 ${userProgress.completedToday ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {userProgress.completedToday ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Completado por Hoy
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5 mr-2" />
                        Iniciar Conversación
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card className="card-custom">
              <CardHeader>
                <CardTitle className="card-title-gold flex items-center gap-2">
                  <Target className="w-5 h-5 icon-gold" />
                  Progreso de Aprendizaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            {/* Level Progress */}
            <Card className="card-custom">
              <CardHeader className="pb-4">
                <CardTitle className="card-title-gold flex items-center gap-2">
                  <TvMinimalPlay className="w-5 h-5 icon-gold" />
                  Progreso de Nivel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="big-number-gold">{userProgress.level}</div>
                <div className="separator" />
                <p className="text-sm muted">Nivel actual</p>
                <div className="pt-2">
                  <span className="chip">
                    {userProgress.xp} XP
                  </span>
                </div>
                <div className="pt-2">
                  <span className="chip">
                    {xpToNextLevel} XP para siguiente nivel
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Nivel {userProgress.level}</span>
                    <span className="text-sm text-gray-500">{xpToNextLevel} XP restantes</span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Streak Counter */}
            <Card className="card-custom">
              <CardHeader className="pb-4">
                <CardTitle className="card-title-gold flex items-center gap-2">
                  <Trophy className="w-5 h-5 icon-gold" />
                  Racha Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="big-number-gold">{userProgress.currentStreak}</div>
                <div className="separator" />
                <p className="text-sm muted">días consecutivos</p>
                <div className="pt-2">
                  <span className="chip">
                    {userProgress.totalDays} días totales
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Topics */}
            <Card className="card-custom">
              <CardHeader className="pb-4">
                  <CardTitle className="card-title-gold flex items-center gap-2">
                  <Lock className="w-5 h-5 icon-gold" />
                  Próximos Temas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[{ topic: "Transparencia Financiera", level: 4, locked: false },
                  { topic: "Denuncias Éticas", level: 5, locked: true },
                  { topic: "Liderazgo Íntegro", level: 6, locked: true }].map((item, index) => (
                  <div
                    key={index}
                    className={`proximo-tema-item${item.locked ? ' locked' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.locked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <span title="¡Desbloqueado!">
                          <Unlock className="w-5 h-5 candado-abierto" />
                        </span>
                      )}
                      <span className={`text-sm${item.locked ? ' muted' : ''}${!item.locked && item.level === 4 ? ' font-bold' : ''}`}>{item.topic}</span>
                    </div>
                    <span className={`nivel-tag${item.locked ? ' locked' : ''}`}>Nivel {item.level}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
