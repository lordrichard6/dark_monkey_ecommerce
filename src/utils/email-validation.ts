export interface EmailValidationResult {
    isValid: boolean
    suggestion?: string
}

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
    'gmail.con': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'outlook.con': 'outlook.com',
    'hotmail.con': 'hotmail.com',
    'yahoo.con': 'yahoo.com',
    'icloud.con': 'icloud.com',
    'protonmail.con': 'protonmail.com',
}

/**
 * Validates email format and provides suggestions for common typos.
 */
export function validateEmail(email: string): EmailValidationResult {
    if (!email) return { isValid: false }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)

    const [localPart, domain] = email.split('@')
    if (!domain) return { isValid }

    const lowercaseDomain = domain.toLowerCase()
    if (COMMON_DOMAIN_TYPOS[lowercaseDomain]) {
        return {
            isValid: false,
            suggestion: `${localPart}@${COMMON_DOMAIN_TYPOS[lowercaseDomain]}`,
        }
    }

    return { isValid }
}
