'use client'

import { useTranslations } from 'next-intl'

type PasswordStrength = 'weak' | 'medium' | 'strong'

interface Props {
    password: string
}

export function PasswordStrengthMeter({ password }: Props) {
    const t = useTranslations('auth')

    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const passedChecks = Object.values(checks).filter(Boolean).length

    let strength: PasswordStrength = 'weak'
    if (passedChecks >= 4) strength = 'strong'
    else if (passedChecks >= 2) strength = 'medium'

    const strengthColor = {
        weak: 'bg-red-500',
        medium: 'bg-yellow-500',
        strong: 'bg-emerald-500',
    }

    const strengthLabels = {
        weak: t('strengthWeak'),
        medium: t('strengthMedium'),
        strong: t('strengthStrong'),
    }

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t('passwordStrength')}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${strength === 'strong' ? 'text-emerald-400' :
                        strength === 'medium' ? 'text-yellow-400' :
                            'text-red-400'
                    }`}>
                    {strengthLabels[strength]}
                </span>
            </div>

            {/* Strength bar */}
            <div className="flex gap-1.5 h-1">
                <div className={`flex-1 rounded-full transition-all duration-500 ${passedChecks >= 1 ? strengthColor[strength] : 'bg-zinc-800'}`} />
                <div className={`flex-1 rounded-full transition-all duration-500 ${passedChecks >= 2 ? strengthColor[strength] : 'bg-zinc-800'}`} />
                <div className={`flex-1 rounded-full transition-all duration-500 ${passedChecks >= 3 ? strengthColor[strength] : 'bg-zinc-800'}`} />
                <div className={`flex-1 rounded-full transition-all duration-500 ${passedChecks >= 4 ? strengthColor[strength] : 'bg-zinc-800'}`} />
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                    <div className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${checks.length ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-600'}`}>
                        {checks.length && <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[11px] transition-colors ${checks.length ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('reqLength')}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${checks.uppercase ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-600'}`}>
                        {checks.uppercase && <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[11px] transition-colors ${checks.uppercase ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('reqUppercase')}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${checks.number ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-600'}`}>
                        {checks.number && <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[11px] transition-colors ${checks.number ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('reqNumber')}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${checks.special ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-600'}`}>
                        {checks.special && <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[11px] transition-colors ${checks.special ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('reqSpecial')}</span>
                </div>
            </div>
        </div>
    )
}
