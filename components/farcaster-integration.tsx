"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Share2, Users, MessageCircle, ExternalLink, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
}

interface FarcasterCast {
  hash: string
  text: string
  timestamp: string
  author: FarcasterUser
  replies: number
  recasts: number
  likes: number
}

interface FarcasterIntegrationProps {
  searchQuery?: string
  searchResults?: number
  txHash?: string
}

export function FarcasterIntegration({ searchQuery, searchResults, txHash }: FarcasterIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [userProfile, setUserProfile] = useState<FarcasterUser | null>(null)
  const [castText, setCastText] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [recentCasts, setRecentCasts] = useState<FarcasterCast[]>([])
  const [farcasterUsername, setFarcasterUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const connectFarcaster = async () => {
    if (!farcasterUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter your Farcaster username",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Симулируем подключение к Farcaster
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockUser: FarcasterUser = {
        fid: Math.floor(Math.random() * 100000),
        username: farcasterUsername,
        displayName: farcasterUsername.charAt(0).toUpperCase() + farcasterUsername.slice(1),
        pfpUrl: `/placeholder.svg?height=40&width=40&query=farcaster+profile+${farcasterUsername}`,
        followerCount: Math.floor(Math.random() * 1000),
        followingCount: Math.floor(Math.random() * 500),
      }

      setUserProfile(mockUser)
      setIsConnected(true)

      // Загружаем недавние касты
      loadRecentCasts()

      toast({
        title: "Connected to Farcaster",
        description: `Welcome back, @${farcasterUsername}!`,
      })
    } catch (error: any) {
      console.error("Ошибка подключения к Farcaster:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Farcaster. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRecentCasts = () => {
    // Симулируем загрузку недавних кастов
    const mockCasts: FarcasterCast[] = [
      {
        hash: "0x" + Math.random().toString(16).substr(2, 8),
        text: "Just discovered an amazing OSINT tool on Monad! 🕷️ #Web3OSINT #MonadTestnet",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        author: {
          fid: 12345,
          username: "osint_hunter",
          displayName: "OSINT Hunter",
          pfpUrl: "/placeholder.svg?height=32&width=32",
          followerCount: 1500,
          followingCount: 300,
        },
        replies: 5,
        recasts: 12,
        likes: 28,
      },
      {
        hash: "0x" + Math.random().toString(16).substr(2, 8),
        text: "Web3 is revolutionizing data intelligence. The future is decentralized! 🚀",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        author: {
          fid: 67890,
          username: "web3_researcher",
          displayName: "Web3 Researcher",
          pfpUrl: "/placeholder.svg?height=32&width=32",
          followerCount: 2300,
          followingCount: 450,
        },
        replies: 8,
        recasts: 15,
        likes: 42,
      },
    ]
    setRecentCasts(mockCasts)
  }

  const postCast = async () => {
    if (!castText.trim()) {
      toast({
        title: "Empty Cast",
        description: "Please enter some text to cast",
        variant: "destructive",
      })
      return
    }

    if (!userProfile) {
      toast({
        title: "Not Connected",
        description: "Please connect to Farcaster first",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    try {
      // Симулируем отправку каста
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newCast: FarcasterCast = {
        hash: "0x" + Math.random().toString(16).substr(2, 8),
        text: castText,
        timestamp: new Date().toISOString(),
        author: userProfile,
        replies: 0,
        recasts: 0,
        likes: 0,
      }

      setRecentCasts([newCast, ...recentCasts])
      setCastText("")

      toast({
        title: "Cast Posted!",
        description: "Your cast has been shared on Farcaster",
      })
    } catch (error: any) {
      console.error("Ошибка отправки каста:", error)
      toast({
        title: "Post Failed",
        description: "Failed to post cast. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const generateSearchCast = () => {
    if (searchQuery && searchResults !== undefined) {
      const castText = `🕷️ Just completed an OSINT search on MonadOsintSearch!\n\n🔍 Query: "${searchQuery}"\n📊 Found results in ${searchResults} databases\n💰 Paid with 1 MON token\n\n#Web3OSINT #MonadTestnet #OSINT ${txHash ? `\n\n🔗 TX: ${txHash.slice(0, 10)}...` : ""}`
      setCastText(castText)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <div className="space-y-6">
      {/* Подключение к Farcaster */}
      {!isConnected ? (
        <Card className="bg-gray-900 border-purple-500 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-300">
              <Users className="h-5 w-5" />
              Connect to Farcaster
            </CardTitle>
            <CardDescription className="text-gray-400">
              Share your OSINT discoveries with the Farcaster community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farcaster-username" className="text-white">
                Farcaster Username
              </Label>
              <Input
                id="farcaster-username"
                placeholder="Enter your Farcaster username"
                value={farcasterUsername}
                onChange={(e) => setFarcasterUsername(e.target.value)}
                className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
              />
            </div>
            <Button
              onClick={connectFarcaster}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Connect to Farcaster
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Профиль пользователя */}
          <Card className="bg-gray-900 border-purple-500 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Connected to Farcaster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={userProfile?.pfpUrl || "/placeholder.svg"}
                  alt={userProfile?.displayName}
                  className="w-12 h-12 rounded-full border-2 border-purple-500"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{userProfile?.displayName}</h3>
                  <p className="text-sm text-gray-400">@{userProfile?.username}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-500">{userProfile?.followerCount} followers</span>
                    <span className="text-xs text-gray-500">{userProfile?.followingCount} following</span>
                  </div>
                </div>
                <Badge className="bg-purple-600 text-white">FID: {userProfile?.fid}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Создание каста */}
          <Card className="bg-gray-900 border-purple-500 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <MessageCircle className="h-5 w-5" />
                Create Cast
              </CardTitle>
              <CardDescription className="text-gray-400">Share your OSINT findings with the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchQuery && (
                <Alert className="bg-purple-900 border-purple-700">
                  <Share2 className="h-4 w-4" />
                  <AlertDescription className="text-purple-100">
                    <div className="flex items-center justify-between">
                      <span>Share your recent search results?</span>
                      <Button
                        onClick={generateSearchCast}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Generate Cast
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="cast-text" className="text-white">
                  What's happening?
                </Label>
                <Textarea
                  id="cast-text"
                  placeholder="Share your thoughts about Web3 OSINT..."
                  value={castText}
                  onChange={(e) => setCastText(e.target.value)}
                  rows={4}
                  maxLength={320}
                  className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{castText.length}/320 characters</span>
                  <Button
                    onClick={postCast}
                    disabled={isPosting || !castText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Casting...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Cast
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Недавние касты */}
          <Card className="bg-gray-900 border-purple-500 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <MessageCircle className="h-5 w-5" />
                Recent Casts
              </CardTitle>
              <CardDescription className="text-gray-400">Latest posts from the OSINT community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCasts.map((cast) => (
                  <div key={cast.hash} className="p-4 bg-gray-800 rounded-lg border border-purple-600">
                    <div className="flex items-start gap-3">
                      <img
                        src={cast.author.pfpUrl || "/placeholder.svg"}
                        alt={cast.author.displayName}
                        className="w-10 h-10 rounded-full border border-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{cast.author.displayName}</span>
                          <span className="text-sm text-gray-400">@{cast.author.username}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(cast.timestamp)}</span>
                        </div>
                        <p className="text-gray-300 mb-3 whitespace-pre-wrap">{cast.text}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            {cast.replies}
                          </button>
                          <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                            <Share2 className="h-4 w-4" />
                            {cast.recasts}
                          </button>
                          <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                            <span>❤️</span>
                            {cast.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
