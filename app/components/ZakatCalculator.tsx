'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ZakatCalculation {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  nisab: number;
  isEligible: boolean;
  zakatAmount: number;
  zakatPercentage: number;
}

interface AssetCategory {
  id: string;
  name: string;
  amount: number;
  description: string;
  isZakatable: boolean;
}

const defaultAssets: AssetCategory[] = [
  { id: 'cash', name: 'Cash & Bank Accounts', amount: 0, description: 'Cash on hand, checking, savings accounts', isZakatable: true },
  { id: 'investments', name: 'Investment Assets', amount: 0, description: 'Stocks, bonds, mutual funds, ETFs held for investment', isZakatable: true },
  { id: 'gold', name: 'Gold & Silver', amount: 0, description: 'All gold and silver (jewelry, coins, bars) at current market value', isZakatable: true },
  { id: 'business', name: 'Business Assets', amount: 0, description: 'Inventory, equipment, accounts receivable for business', isZakatable: true },
  { id: 'rental_income', name: 'Rental Income Savings', amount: 0, description: 'Savings from rental properties (not the property itself)', isZakatable: true },
  { id: 'crypto', name: 'Cryptocurrency', amount: 0, description: 'Bitcoin, Ethereum, and other cryptocurrencies', isZakatable: true },
  { id: 'other', name: 'Other Zakatable Assets', amount: 0, description: 'Other wealth that has been held for one lunar year', isZakatable: true },
];

const defaultLiabilities = [
  { id: 'debt', name: 'Immediate Debts', amount: 0, description: 'Short-term debts due within the Zakat year (credit cards, personal loans)' },
  { id: 'bills', name: 'Due Payments', amount: 0, description: 'Bills and payments currently due (utilities, rent, taxes)' },
];

export default function ZakatCalculator() {
  const [assets, setAssets] = useState<AssetCategory[]>(defaultAssets);
  const [liabilities, setLiabilities] = useState(defaultLiabilities);
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [nisabType, setNisabType] = useState<'gold' | 'silver'>('gold');
  const [currency, setCurrency] = useState('USD');
  const [goldPrice, setGoldPrice] = useState(0);
  const [silverPrice, setSilverPrice] = useState(0);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});

  // Fetch current gold and silver prices and exchange rates
  const fetchMetalPrices = async () => {
    try {
      setIsLoadingPrices(true);

      // Fetch metal prices
      const metalResponse = await fetch('/api/metal-prices');
      let goldPriceUSD = 2000;
      let silverPriceUSD = 25;

      if (metalResponse.ok) {
        const metalData = await metalResponse.json();
        goldPriceUSD = metalData.gold || 2000;
        silverPriceUSD = metalData.silver || 25;
      }

      // Fetch exchange rates
      const exchangeResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      let rates = { USD: 1 };

      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        rates = exchangeData.rates || { USD: 1 };
      }

      setExchangeRates(rates);
      setGoldPrice(goldPriceUSD);
      setSilverPrice(silverPriceUSD);
    } catch (error) {
      // Fallback prices and rates
      setGoldPrice(2000);
      setSilverPrice(25);
      setExchangeRates({ USD: 1 });
    } finally {
      setIsLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchMetalPrices();
  }, []);

  // Calculate Nisab based on current metal prices in selected currency
  const calculateNisab = useCallback(() => {
    const exchangeRate = exchangeRates[currency] || 1;

    if (nisabType === 'gold') {
      // Nisab for gold is 87.48 grams (approximately 3 ounces)
      return (goldPrice * 3) * exchangeRate;
    } else {
      // Nisab for silver is 612.36 grams (approximately 20 ounces)
      return (silverPrice * 20) * exchangeRate;
    }
  }, [nisabType, goldPrice, silverPrice, currency, exchangeRates]);

  // Calculate Zakat
  const calculateZakat = useCallback(() => {
    const totalAssets = assets.reduce((sum, asset) =>
      sum + (asset.isZakatable ? asset.amount : 0), 0
    );

    const totalLiabilities = liabilities.reduce((sum, liability) =>
      sum + liability.amount, 0
    );

    const netWorth = totalAssets - totalLiabilities;
    const nisab = calculateNisab();
    const isEligible = netWorth >= nisab;
    const zakatAmount = isEligible ? netWorth * 0.025 : 0; // 2.5%

    setCalculation({
      totalAssets,
      totalLiabilities,
      netWorth,
      nisab,
      isEligible,
      zakatAmount,
      zakatPercentage: 2.5
    });
  }, [assets, liabilities, calculateNisab]);

  // Update asset amount
  const updateAsset = (id: string, amount: number) => {
    setAssets(prev => prev.map(asset =>
      asset.id === id ? { ...asset, amount } : asset
    ));
  };

  // Update liability amount
  const updateLiability = (id: string, amount: number) => {
    setLiabilities(prev => prev.map(liability =>
      liability.id === id ? { ...liability, amount } : liability
    ));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate on every change
  useEffect(() => {
    calculateZakat();
  }, [calculateZakat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-transparent"
    >
      <div className="max-w-4xl mx-auto px-6 py-12 sm:px-8">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-gray-50 mb-2 tracking-tight">Zakat Calculator</h1>
          <p className="text-gray-500 dark:text-gray-400 font-light text-lg">Calculate your annual Zakat obligation</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Input Column */}
          <div className="lg:col-span-2 space-y-16">

            {/* Settings Section - Text Only/Minimal */}
            <section className="flex flex-wrap items-center gap-8 pb-8 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-lg font-medium text-gray-900 dark:text-white border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  {/* Add more common currencies as needed */}
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Nisab Standard</label>
                <select
                  value={nisabType}
                  onChange={(e) => setNisabType(e.target.value as 'gold' | 'silver')}
                  className="bg-transparent text-lg font-medium text-gray-900 dark:text-white border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="gold">Gold Standard (87.48g)</option>
                  <option value="silver">Silver Standard (612.36g)</option>
                </select>
              </div>

              <div className="flex flex-col ml-auto text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Current Threshold</span>
                <div className="flex items-center gap-2 justify-end">
                  {isLoadingPrices ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-lg font-medium text-amber-600 dark:text-amber-400">{formatCurrency(calculateNisab())}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Assets Section */}
            <section>
              <h2 className="text-2xl font-serif text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                Your Assets
                <span className="text-sm font-sans font-normal text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-full">Wealth & Savings</span>
              </h2>
              <div className="space-y-8">
                {assets.map((asset) => (
                  <div key={asset.id} className="group">
                    <div className="flex items-baseline justify-between mb-2">
                      <label className="text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {asset.name}
                      </label>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm font-light">$</span>
                        <input
                          type="number"
                          value={asset.amount || ''}
                          onChange={(e) => updateAsset(asset.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-32 text-right bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-amber-500 outline-none py-1 text-lg font-mono text-gray-900 dark:text-gray-100 placeholder-gray-300 transition-colors"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-light">{asset.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Liabilities Section */}
            <section>
              <h2 className="text-2xl font-serif text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                Your Liabilities
                <span className="text-sm font-sans font-normal text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-full">Debts & Due Payments</span>
              </h2>
              <div className="space-y-8">
                {liabilities.map((liability) => (
                  <div key={liability.id} className="group">
                    <div className="flex items-baseline justify-between mb-2">
                      <label className="text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-rose-500 transition-colors">
                        {liability.name}
                      </label>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm font-light">$</span>
                        <input
                          type="number"
                          value={liability.amount || ''}
                          onChange={(e) => updateLiability(liability.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-32 text-right bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-rose-500 outline-none py-1 text-lg font-mono text-gray-900 dark:text-gray-100 placeholder-gray-300 transition-colors"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-light">{liability.description}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Results Column - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-8 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <h3 className="text-lg font-serif text-gray-900 dark:text-white mb-6">Summary</h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Assets</span>
                  <span className="font-mono text-gray-900 dark:text-gray-200">{formatCurrency(calculation?.totalAssets || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Liabilities</span>
                  <span className="font-mono text-gray-900 dark:text-gray-200">- {formatCurrency(calculation?.totalLiabilities || 0)}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900 dark:text-white">Net Worth</span>
                  <span className="font-mono text-gray-900 dark:text-white">{formatCurrency(calculation?.netWorth || 0)}</span>
                </div>
              </div>

              <div className={`p-6 rounded-2xl text-center transition-colors ${calculation?.isEligible
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <p className="text-sm font-medium mb-1 opacity-90">Zakat Payable (2.5%)</p>
                <p className="text-3xl font-serif font-bold">
                  {formatCurrency(calculation?.zakatAmount || 0)}
                </p>
                {!calculation?.isEligible && (
                  <p className="text-xs mt-2 opacity-75">Below Nisab Threshold</p>
                )}
              </div>

              <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <InformationCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                  <span className="font-semibold block mb-1">Hawl Requirement</span>
                  Zakat is only due on wealth that has been in your possession for one complete lunar year. Excluding personal use items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
