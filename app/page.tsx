"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Target, MessageCircle, Volume2, CheckCircle2, Lock, Mic } from "lucide-react"
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

  const [showRealtimeChat, setShowRealtimeChat] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleStartRealtimeChat = () => {
    setShowRealtimeChat(true)
  }

  const xpToNextLevel = userProgress.level * 500 - (userProgress.xp % 500)
  const progressToNextLevel = ((userProgress.xp % 500) / 500) * 100

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">EthicsAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Capacitación Anti-Corrupción</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleStartRealtimeChat}
              >
                <Mic className="w-4 h-4" />
                Voice Chat
              </Button>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Nivel {userProgress.level}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {userProgress.xp} XP
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                      ✨ Chat de Audio con IA
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Experimenta la nueva tecnología de OpenAI Realtime API. Escucha los mensajes de voz 
                      de Marcus usando WebRTC para una comunicación instantánea y natural.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartRealtimeChat}
                    className="w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Iniciar Chat con Marcus
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Progreso de Aprendizaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Racha actual</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-orange-600">{userProgress.currentStreak}</span>
                    <span className="text-sm text-gray-500">días</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total días</span>
                  <span className="font-bold">{userProgress.totalDays}</span>
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

            {/* Weekly Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objetivos Semanales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm">5 días de práctica</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm">2 escenarios completados</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  <span className="text-sm text-gray-500">Quiz final semanal</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/scenarios">
                    <Target className="w-4 h-4 mr-2" />
                    Ver Escenarios
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleStartRealtimeChat}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Chat con Marcus
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/progress">
                    <Trophy className="w-4 h-4 mr-2" />
                    Mi Progreso
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
