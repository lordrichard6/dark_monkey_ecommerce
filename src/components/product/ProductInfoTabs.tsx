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

const RICH_TEXT_CLASSES = [
  'text-sm leading-relaxed text-zinc-400',
  '[&_p]:mb-4 [&_p:last-child]:mb-0',
  '[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-zinc-200 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1:first-child]:mt-0',
  '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-zinc-200 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2:first-child]:mt-0',
  '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-300 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0',
  '[&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:pl-0',
  '[&_ol]:mb-4 [&_ol]:space-y-1.5 [&_ol]:pl-0',
  '[&_li]:flex [&_li]:items-start [&_li]:gap-2',
  '[&_li]:before:mt-[0.4em] [&_li]:before:h-1 [&_li]:before:w-1 [&_li]:before:shrink-0 [&_li]:before:rounded-full [&_li]:before:bg-amber-500/60 [&_li]:before:content-[""]',
  '[&_strong]:font-semibold [&_strong]:text-zinc-200',
  '[&_em]:italic [&_em]:text-zinc-300',
  '[&_a]:text-amber-400 [&_a]:underline-offset-2 [&_a:hover]:text-amber-300',
].join(' ')

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
      <div className="flex gap-px rounded-2xl bg-white/[0.05] p-px border border-white/5 overflow-hidden">
        {visibleTabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              activeTab === id
                ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${activeTab === id ? 'text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{t(labelKey as Parameters<typeof t>[0])}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-3 rounded-2xl border border-white/5 bg-zinc-900/20 px-5 py-5 md:px-8 md:py-7">
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
