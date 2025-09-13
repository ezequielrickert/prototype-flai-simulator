"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Loader2, Pause } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoicePlayerProps {
  text: string
  voiceId?: string
  autoPlay?: boolean
  className?: string
}

export function VoicePlayer({ text, voiceId = "pNInz6obpgDQGcFmaJgB", autoPlay = false, className }: VoicePlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const generateSpeech = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId }),
      })

      const data = await response.json()

      if (data.success) {
        setAudioUrl(data.audioUrl)
        if (data.message) {
          toast({
            title: "Modo Demo",
            description: data.message,
            variant: "default",
          })
        }
      } else {
        throw new Error(data.error || "Failed to generate speech")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error generating speech"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const togglePlayback = () => {
    if (!audioUrl) {
      generateSpeech()
      return
    }

    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  useEffect(() => {
    if (audioUrl && autoPlay) {
      playAudio()
    }
  }, [audioUrl, autoPlay])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)
      const handlePlay = () => setIsPlaying(true)

      audio.addEventListener("ended", handleEnded)
      audio.addEventListener("pause", handlePause)
      audio.addEventListener("play", handlePlay)

      return () => {
        audio.removeEventListener("ended", handleEnded)
        audio.removeEventListener("pause", handlePause)
        audio.removeEventListener("play", handlePlay)
      }
    }
  }, [audioUrl])

  return (
    <div className={className}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <Button
        onClick={togglePlayback}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-transparent"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        {isLoading ? "Generando..." : isPlaying ? "Pausar" : "Escuchar"}
      </Button>

      {error && (
        <Card className="mt-2 border-red-200 dark:border-red-800">
          <CardContent className="p-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
