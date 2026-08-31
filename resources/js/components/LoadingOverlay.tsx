import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

export default function LoadingOverlay() {
  const [loading, setLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const removeStart = router.on('start', () => setLoading(true))
    const removeProgress = router.on('progress', (event) => {
      setProgress(event.detail.progress?.percentage ?? 0)
    })
    const removeFinish = router.on('finish', () => {
      setLoading(false)
      setProgress(0)
    })

    return () => {
      removeStart()
      removeProgress()
      removeFinish()
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white">
      <img
        src="/maximilian_shimmer_loader.gif"
        alt="Loading"
        className="w-100"
        draggable={false}
      />
      {progress > 0 && (
        <span className="text-sm font-medium text-black/70">{progress}%</span>
      )}
    </div>
  )
}