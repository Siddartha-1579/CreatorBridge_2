/**
 * Centralized currency formatting and calculation utilities for CreatorBridge.
 * Enforces Indian Rupees (INR, ₹) as the primary platform standard using Intl.NumberFormat('en-IN', ...)
 * while preserving authentic historical currencies (e.g. USD) without silent reinterpretation.
 */

export type SupportedCurrency = "INR" | "USD"

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const inrDetailedFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const usdDetailedFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats an amount with localized symbols and digit grouping.
 * @param amount - The numerical value. If amount is in subunits (paise or cents), pass isSubunits=true.
 * @param currency - "INR" (default) or "USD"
 * @param isSubunits - True if amount is stored in smallest currency unit (paise/cents).
 * @param showDecimals - Whether to enforce 2 fractional digits.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "INR",
  isSubunits: boolean = false,
  showDecimals: boolean = false
): string {
  if (amount == null || isNaN(amount)) return "—"

  const value = isSubunits ? amount / 100 : amount
  const normalizedCurr = (currency || "INR").toUpperCase()

  if (normalizedCurr === "USD") {
    return showDecimals ? usdDetailedFormatter.format(value) : usdFormatter.format(value)
  }

  // Default to INR (en-IN notation with Lakhs and Crores grouping)
  return showDecimals ? inrDetailedFormatter.format(value) : inrFormatter.format(value)
}

/**
 * Returns formatted INR string for whole rupee values.
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  return formatCurrency(amount, "INR", false, showDecimals)
}

/**
 * Returns formatted INR string for amounts stored in paise.
 */
export function formatPaise(amountPaise: number, showDecimals: boolean = false): string {
  return formatCurrency(amountPaise, "INR", true, showDecimals)
}

/**
 * Returns standard currency symbol (₹ for INR, $ for USD).
 */
export function getCurrencySymbol(currency: string = "INR"): string {
  return currency.toUpperCase() === "USD" ? "$" : "₹"
}
