import { XLM_USD_RATE } from "@/lib/constants";

export interface WinningsCalculation {
	grossWinnings: number;
	platformFee: number;
	netWinnings: number;
	profit: number;
	roi: number;
}

const FEE = 0.05;

export function calculatePotentialWinnings(
	stakeAmount: number,
	side: "yes" | "no",
	yesPool: number,
	noPool: number,
): WinningsCalculation {
	const winningSidePool = (side === "yes" ? yesPool : noPool) + stakeAmount;
	const totalPool = yesPool + noPool + stakeAmount;
	const gross = (stakeAmount / winningSidePool) * totalPool;
	const fee = gross * FEE;
	const net = gross - fee;
	const profit = net - stakeAmount;
	const roi = (profit / stakeAmount) * 100;
	return {
		grossWinnings: gross,
		platformFee: fee,
		netWinnings: net,
		profit,
		roi,
	};
}

export function calculatePoolPercentages(yesPool: number, noPool: number) {
	const total = yesPool + noPool;
	if (!total) return { yes: 50, no: 50 };
	return {
		yes: Math.round((yesPool / total) * 100),
		no: Math.round((noPool / total) * 100),
	};
}

export function formatCurrency(
	amount: number,
	locale: string = "en-US",
	currency: string = "USD",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(amount);
}

export function formatCompactCurrency(
	amount: number,
	locale: string = "en-US",
	currency: string = "USD",
): string {
	if (amount >= 1e6) {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(amount);
	}
	if (amount >= 1e3) {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(amount);
	}
	return formatCurrency(amount, locale, currency);
}

export function formatAddress(addr: string): string {
	return addr.length < 8 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function formatXLM(amount: number, locale: string = "en-US"): string {
	return `${new Intl.NumberFormat(locale).format(Math.round(amount))} XLM`;
}

export function convertXlmToUsd(xlm: number): number {
	return xlm * XLM_USD_RATE;
}

export function convertUsdToXlm(usd: number): number {
	return usd / XLM_USD_RATE;
}

