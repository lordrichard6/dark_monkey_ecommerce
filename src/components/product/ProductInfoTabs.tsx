'use client'

import { useState } from 'react'
import { Shirt, Droplets, Truck, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Tab = 'material' | 'care' | 'shipment' | 'gpsr'

type Props = {
  materialInfo: string | null
  careInstructions: string | null
  printMethod: string | null
  originCountry: string | null
  avgFulfillmentTime: string | null
  shipmentInfo: string | null
  gpsrInfo: string | null
}

const RICH_TEXT_CLASSES =
  'styled-description prose prose-invert prose-sm max-w-none text-zinc-400 font-sans leading-relaxed'

export function ProductInfoTabs({
  materialInfo,
  careInstructions,
  printMethod,
  originCountry,
  avgFulfillmentTime,
  shipmentInfo,
  gpsrInfo,
}: Props) {
  const t = useTranslations('product')

  // Only show tabs that have actual content — never show "No X available" placeholders
  const hasContent: Record<Tab, boolean> = {
    material: !!(materialInfo || originCountry),
    care: !!(careInstructions || printMethod),
    shipment: !!(shipmentInfo || avgFulfillmentTime),
    gpsr: !!gpsrInfo,
  }

  const allTabs: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
    { id: 'material', labelKey: 'tabMaterial', icon: Shirt },
    { id: 'care', labelKey: 'tabCare', icon: Droplets },
    { id: 'shipment', labelKey: 'tabShipment', icon: Truck },
    { id: 'gpsr', labelKey: 'tabGpsr', icon: ShieldCheck },
  ]

  const visibleTabs = allTabs.filter((tab) => hasContent[tab.id])

  const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0]?.id ?? 'material')

  if (visibleTabs.length === 0) return null

  return (
    <div className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-zinc-900/60 p-1 border border-white/5">
        {visibleTabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
              activeTab === id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{t(labelKey as Parameters<typeof t>[0])}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 rounded-2xl border border-white/5 bg-zinc-900/20 px-6 py-6 md:px-10 md:py-8">
        {activeTab === 'material' && (
          <TabContent>
            {originCountry && (
              <div className="mb-5 flex items-center gap-2">
                <span className="rounded-full bg-zinc-800 border border-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
                  🌍 Made in {originCountry}
                </span>
              </div>
            )}
            {materialInfo && (
              <div
                className={RICH_TEXT_CLASSES}
                dangerouslySetInnerHTML={{ __html: materialInfo }}
              />
            )}
          </TabContent>
        )}

        {activeTab === 'care' && (
          <TabContent>
            {printMethod && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3">
                <span className="mt-0.5 text-lg">🖨️</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Print Method
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-300">{printMethod}</p>
                </div>
              </div>
            )}
            {careInstructions ? (
              <div
                className={RICH_TEXT_CLASSES}
                dangerouslySetInnerHTML={{ __html: careInstructions }}
              />
            ) : (
              <DefaultCareInstructions />
            )}
          </TabContent>
        )}

        {activeTab === 'shipment' && (
          <TabContent>
            {avgFulfillmentTime && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Production time
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-300">
                    Usually produced in {avgFulfillmentTime} after your order
                  </p>
                </div>
              </div>
            )}
            {shipmentInfo && (
              <div
                className={RICH_TEXT_CLASSES}
                dangerouslySetInnerHTML={{ __html: shipmentInfo }}
              />
            )}
          </TabContent>
        )}

        {activeTab === 'gpsr' && gpsrInfo && (
          <TabContent>
            <div className={RICH_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: gpsrInfo }} />
          </TabContent>
        )}
      </div>
    </div>
  )
}

function TabContent({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in duration-150">{children}</div>
}

function DefaultCareInstructions() {
  const instructions = [
    { icon: '🌡️', label: 'Machine wash cold (30°C max)' },
    { icon: '🔄', label: 'Wash inside out to protect the print' },
    { icon: '🚫', label: 'Do not bleach' },
    { icon: '🔆', label: 'Tumble dry low, remove promptly' },
    { icon: '♨️', label: 'Iron inside out on low heat only — do not iron directly on print' },
    { icon: '🚿', label: 'Do not dry clean' },
  ]
  return (
    <ul className="space-y-2.5">
      {instructions.map((item) => (
        <li key={item.label} className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="text-base">{item.icon}</span>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
