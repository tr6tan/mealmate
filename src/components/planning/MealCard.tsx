import type { Meal, Period } from '@/types'
import { cn } from '@/lib/utils'
import MealAvatar from '@/components/ui/MealAvatar'

interface Props {
  meal: Meal
  onPress: () => void
  period?: Period
}

/** Détecte les repas restaurant, y compris les anciens enregistrements Firestore sans le flag. */
function isResto(meal: Meal) {
  return meal.isRestaurant === true || meal.name === 'Restaurant'
}

export default function MealCard({ meal, onPress, period }: Props) {
  if (isResto(meal)) {
    return (
      <button
        onClick={onPress}
        className={cn(
          'w-full rounded-2xl px-4 py-3 flex items-center gap-3',
          'active:scale-[0.97] transition-all duration-150 text-left relative overflow-hidden',
        )}
        style={{
          background: 'linear-gradient(135deg, #001080 0%, #0022CC 40%, #2B50F0 58%, #0022CC 75%, #001080 100%)',
          boxShadow: '0 6px 24px rgba(0,20,180,0.55), 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* reflet brillant */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
            borderRadius: 'inherit',
          }}
        />
        {/* ligne lumière haute */}
        <div
          className="absolute top-0 left-4 right-4 h-px pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.30)' }}
        />
        <div
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
        >
          <span className="text-xl leading-none">🍽️</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-black text-white tracking-tight truncate">
            {meal.name && meal.name !== 'Restaurant' ? meal.name : 'Restaurant'}
          </div>
          <span className="text-[11px] font-semibold mt-0.5 block" style={{ color: 'rgba(255,255,255,0.50)' }}>
            On mange dehors 🌆
          </span>
        </div>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full rounded-2xl px-4 py-3 flex items-center gap-3',
        'active:scale-[0.97] transition-all duration-150 text-left relative overflow-hidden',
      )}
      style={{
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F7F4EE 100%)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      {/* reflet nacré diagonal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(155deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0) 40%)',
          borderRadius: 'inherit',
        }}
      />
      {/* ligne lumière haute */}
      <div
        className="absolute top-0 left-4 right-4 h-px pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.95)' }}
      />
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #FFF8F3 0%, #F0EAE0 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {meal.emoji
          ? <span className="text-xl leading-none">{meal.emoji}</span>
          : <MealAvatar name={meal.name} size="md" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-black text-text1 tracking-tight truncate">{meal.name}</div>
        <div className="flex gap-1.5 mt-0.5 flex-wrap">
          {meal.time && (
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {meal.time}
            </span>
          )}
          {meal.fav && (
            <span className="text-[11px] font-semibold text-sage flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Favori
            </span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.18)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
