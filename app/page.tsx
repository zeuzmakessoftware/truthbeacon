'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Zap, SearchCheck, AlertCircle, Loader2 } from 'lucide-react'

interface AnalysisResult {
  truthProbability: number
  explanation: {
    verdict: string
    keyPoints: string[]
    sources: string[]
  }
}

export default function DebunkerPlatform() {
  const [claim, setClaim] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [leaderboard, setLeaderboard] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(false)

  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 500], ['0%', '50%'])

  useEffect(() => {
    setLeaderboard(
      Array.from({ length: 10 }, () => Math.floor(Math.random() * 1000))
    )
  }, [])

  const handleSubmit = async () => {
    if (!claim.trim()) return
    setLoading(true)
    setAnalysis(null)

    try {
      const response = await fetch('/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: claim })
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data: AnalysisResult = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!leaderboard) return <div className="text-white">Loading leaderboard…</div>

  return (
    <>
      <motion.div
        style={{ y: bgY }}
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_#2e026d,_#15162c)] pointer-events-none -z-10 flex"
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="justify-items-center p-8 max-w-7xl mx-auto min-h-screen text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-white/10 backdrop-blur-xl border py-6 border-white/20 rounded-3xl shadow-2xl overflow-hidden w-[95%]"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-5xl font-extrabold tracking-tight pt-3">
              <SearchCheck className="w-8 h-8 text-white drop-shadow-lg" />
              Truth Beacon
            </CardTitle>
            <CardDescription className="text-md text-white drop-shadow-lg pb-4">
              Powered by Cerebras and Qwen 3 32B
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Input
                value={claim}
                onChange={e => setClaim(e.target.value)}
                placeholder="Enter suspicious claim..."
                className="h-24 bg-[#2a2936] border-transparent focus:border-[#3A82FF] focus:ring-[#3A82FF] placeholder:text-[#888]"
              />
            </motion.div>

            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover="hover"
              className="relative flex items-center justify-center w-full py-4 font-semibold rounded-full overflow-hidden bg-[#FF6B3A]"
              variants={{
                hover: { scale: 1.025, boxShadow: '0 0 20px rgba(255,107,58,0.6)' },
              }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span
                className="absolute inset-0 bg-gradient-to-r from-[#FF6B3A] to-[#FF9A5A] opacity-80 transform -translate-x-full hover:translate-x-0 transition-transform duration-700"
              />
              <span className="relative flex items-center gap-2 text-white">
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {loading ? 'Analyzing…' : 'Analyze Claim'}
              </span>
            </motion.button>

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <Progress
                    value={analysis.truthProbability}
                    className="h-4 w-full bg-[#2a2936]/50 rounded-full overflow-hidden"
                  />
                  <span className="font-bold text-xl drop-shadow-sm">
                    {analysis.truthProbability}%
                  </span>
                </div>

                <Badge
                  variant="destructive"
                  className="inline-flex items-center gap-2 px-4 py-2 text-lg bg-[#FF6B3A]/20 border border-[#FF6B3A] text-[#FF6B3A] drop-shadow-xl contrast-150 brightness-125"
                >
                  <AlertCircle className="w-5 h-5" />
                  {analysis.explanation.verdict}
                </Badge>

                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 py-4 space-y-4 border border-white/10 shadow-lg">
                  <h3 className="text-2xl font-semibold">Key Evidence</h3>
                  <ul className="list-disc list-inside space-y-2 text-[#ccc]">
                    {analysis.explanation.keyPoints.map((pt, i) => (
                      <motion.li
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                      >
                        {pt}
                      </motion.li>
                    ))}
                  </ul>

                  <h3 className="text-2xl font-semibold mt-4">Sources</h3>
                  <div className="flex flex-wrap gap-3">
                    {analysis.explanation.sources.map((src, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="px-3 py-1 border-[#3A82FF] text-[#3A82FF] backdrop-blur-sm"
                      >
                        {src}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </motion.div>
      </div>
    </>
  )
}
