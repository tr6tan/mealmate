import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const CATEGORIES: { id: ShoppingCategory; icon: string }[] = [
  { id: 'legumes',  icon: '🥦' },
  { id: 'viandes',  icon: '🥩' },
  { id: 'cremerie', icon: '🧀' },
  { id: 'epicerie', icon: '🛒' },
  { id: 'maison',   icon: '🧴' },
]

export default function AddItemSheet() {
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [category, setCategory] = useState<ShoppingCategory>('epicerie')

  const handleAdd = () => {
    if (!name.trim()) return
    addShoppingItem({ name: name.trim(), qty: qty.trim(), category, checked: false })
    setName('')
    setQty('')
    closeSheet()
    showToast(`${name.trim()} ajouté !`)
  }

  return (
    <BottomSheet name="add-item">
      <h2 className="text-[17px] font-extrabold text-text1 mb-4">Ajouter un article</h2>

      <div className="space-y-2.5 mb-4">
        <input
          type="text"
          placeholder="Nom de l'article…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
        <input
          type="text"
          placeholder="Quantité (ex : 500g, 2 pièces…)"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
      </div>

      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Catégorie</p>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200',
              category === cat.id
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {cat.icon} {CAT_LABELS[cat.id].split(' ')[0]}
          </button>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
      >
        Ajouter à la liste
      </button>
    </BottomSheet>
  )
}
