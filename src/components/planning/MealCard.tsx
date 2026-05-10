import type { Meal, Period } from '@/types'
import { cn } from '@/lib/utils'
import MealAvatar from '@/components/ui/MealAvatar'
import FoodSticker from '@/components/ui/FoodSticker'

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
          // Contour or chaud : ambiance "soirée chic restaurant gastronomique"
          boxShadow: [
            '0 0 0 1.5px rgba(255,225,150,0.95)',          // liseré or pâle net
            '0 0 0 3px rgba(255,190,80,0.55)',             // halo ambre brillant
            '0 0 14px 2px rgba(255,180,60,0.45)',          // glow doré extérieur
            '0 8px 24px rgba(0,15,140,0.55)',              // ombre portée bleu marine
            'inset 0 1px 0 rgba(255,235,180,0.22)',        // highlight intérieur haut chaud
            'inset 0 0 0 1px rgba(255,210,130,0.18)',      // liseré intérieur or pâle
          ].join(', '),
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
        {/* ligne lumière haute (or pâle) */}
        <div
          className="absolute top-0 left-4 right-4 h-px pointer-events-none"
          style={{ background: 'rgba(255,225,160,0.55)' }}
        />
        <div
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center"
        >
          <img src="/icons/stickers/dinner.png" alt="" className="w-11 h-11 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }} />
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
        'w-full rounded-xl px-3 py-2.5 flex items-center gap-3',
        'active:scale-[0.98] transition-transform duration-150 text-left',
      )}
    >
      <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center">
        <FoodSticker
          name={meal.name}
          size={36}
          fallback={meal.emoji
            ? <span className="text-lg leading-none">{meal.emoji}</span>
            : <MealAvatar name={meal.name} size="md" />}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-text1 truncate">{meal.name}</div>
        <div className="flex gap-1.5 mt-1 flex-wrap">
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
      <svg className="w-4 h-4 text-muted/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
