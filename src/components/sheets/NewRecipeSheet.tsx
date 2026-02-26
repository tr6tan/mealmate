import { useState, useRef } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period } from '@/types'
import { PERIOD_LABEL, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const PERIODS: Period[] = ['pdej', 'midi', 'soir']

function resizeToBase64(file: File, maxW = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function NewRecipeSheet() {
  const addRecipe = useAppStore((s) => s.addRecipe)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [time, setTime] = useState('')
  const [period, setPeriod] = useState<Period>('midi')
  const [fav, setFav] = useState(false)
  const [rapide, setRapide] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await resizeToBase64(file)
      setPhoto(b64)
    } catch {
      showToast('Erreur lors du chargement de la photo')
    }
  }

  const updateStep = (idx: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)))
  }

  const addStep = () => setSteps((prev) => [...prev, ''])

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)
    addRecipe({
      name: name.trim(),
      emoji,
      period,
      time: time.trim() || '? min',
      fav,
      rapide,
      steps: cleanSteps.length ? cleanSteps : undefined,
      photo,
    })
    // Reset
    setName('')
    setEmoji('🍽️')
    setTime('')
    setPeriod('midi')
    setFav(false)
    setRapide(false)
    setSteps([''])
    setPhoto(undefined)
    closeSheet()
    showToast(`${name.trim()} ajoutée !`)
  }

  return (
    <BottomSheet name="new-recipe">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-extrabold text-text1">Nouvelle recette</h2>
        <button onClick={closeSheet} className="text-muted text-xl">✕</button>
      </div>

      <div className="space-y-2.5 mb-4">
        {/* Emoji + nom */}
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 px-3 py-3 bg-card border-[1.5px] border-border rounded-2xl text-xl text-center outline-none focus:border-terra"
          />
          <input
            type="text"
            placeholder="Nom de la recette…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
          />
        </div>
        <input
          type="text"
          placeholder="Temps de préparation (ex : 20 min)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
      </div>

      {/* Photo */}
      <div className="mb-4">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Photo</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-[100px] rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="aperçu" className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-[11px] font-bold text-muted">Ajouter une photo</span>
            </>
          )}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => setPhoto(undefined)}
            className="mt-1.5 text-[11px] font-bold text-muted/70 underline"
          >
            Supprimer la photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Période */}
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Période</p>
      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200',
              period === p
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="flex gap-5 mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
          <input
            type="checkbox"
            checked={fav}
            onChange={(e) => setFav(e.target.checked)}
            className="w-4 h-4 accent-terra"
          />
          Favori
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
          <input
            type="checkbox"
            checked={rapide}
            onChange={(e) => setRapide(e.target.checked)}
            className="w-4 h-4 accent-terra"
          />
          Rapide
        </label>
      </div>

      {/* Étapes */}
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Étapes</p>
      <div className="space-y-2 mb-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-3 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-terra text-white text-[10px] font-extrabold">
              {idx + 1}
            </span>
            <textarea
              rows={2}
              placeholder={`Étape ${idx + 1}…`}
              value={step}
              onChange={(e) => updateStep(idx, e.target.value)}
              className="flex-1 px-3 py-2.5 bg-card border-[1.5px] border-border rounded-2xl text-sm text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors resize-none leading-snug"
            />
            {steps.length > 1 && (
              <button
                onClick={() => removeStep(idx)}
                className="mt-2 text-muted hover:text-red-400 text-lg leading-none transition-colors"
                aria-label="Supprimer l'étape"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addStep}
        className="w-full py-2 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted hover:border-terra hover:text-terra transition-colors mb-5"
      >
        + Ajouter une étape
      </button>

      <button
        onClick={handleSave}
        className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
      >
        Ajouter la recette
      </button>
    </BottomSheet>
  )
}
