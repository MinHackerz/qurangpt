'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

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
  const [currency, setCurrency] = useState('INR');
  const [goldPrice, setGoldPrice] = useState(0);
  const [silverPrice, setSilverPrice] = useState(0);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});

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
      className="min-h-[70vh] flex items-start justify-center"
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-2 border-green-200 dark:border-green-700">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Zakat Calculator</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
          Calculate your Zakat obligation based on wealth held for one full lunar year (Hawl). Zakat is 2.5% of your net zakatable wealth above the Nisab threshold. Only include assets that exceed your basic needs and necessities.
        </p>
      </div>

      {/* Nisab Settings */}
      <div className="bg-transparent dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nisab Calculation</h2>
        
        {/* Currency Selection */}
        <div className="mb-6 p-3 sm:p-4 bg-transparent dark:bg-transparent rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Currency</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your preferred currency for calculations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent touch-manipulation"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="BRL">BRL - Brazilian Real</option>
                <option value="MXN">MXN - Mexican Peso</option>
                <option value="RUB">RUB - Russian Ruble</option>
                <option value="KRW">KRW - South Korean Won</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="HKD">HKD - Hong Kong Dollar</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="EGP">EGP - Egyptian Pound</option>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="GHS">GHS - Ghanaian Cedi</option>
                <option value="MAD">MAD - Moroccan Dirham</option>
                <option value="TND">TND - Tunisian Dinar</option>
                <option value="DZD">DZD - Algerian Dinar</option>
                <option value="LYD">LYD - Libyan Dinar</option>
                <option value="SDG">SDG - Sudanese Pound</option>
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="ZWL">ZWL - Zimbabwean Dollar</option>
                <option value="BWP">BWP - Botswanan Pula</option>
                <option value="NAD">NAD - Namibian Dollar</option>
                <option value="SZL">SZL - Swazi Lilangeni</option>
                <option value="LSL">LSL - Lesotho Loti</option>
                <option value="MWK">MWK - Malawian Kwacha</option>
                <option value="ZMW">ZMW - Zambian Kwacha</option>
                <option value="AOA">AOA - Angolan Kwanza</option>
                <option value="MZN">MZN - Mozambican Metical</option>
                <option value="MGA">MGA - Malagasy Ariary</option>
                <option value="MUR">MUR - Mauritian Rupee</option>
                <option value="SCR">SCR - Seychellois Rupee</option>
                <option value="KMF">KMF - Comorian Franc</option>
                <option value="DJF">DJF - Djiboutian Franc</option>
                <option value="SOS">SOS - Somali Shilling</option>
                <option value="ERN">ERN - Eritrean Nakfa</option>
                <option value="SSP">SSP - South Sudanese Pound</option>
                <option value="XAF">XAF - Central African CFA Franc</option>
                <option value="CDF">CDF - Congolese Franc</option>
                <option value="STN">STN - São Tomé and Príncipe Dobra</option>
                <option value="CVE">CVE - Cape Verdean Escudo</option>
                <option value="XOF">XOF - West African CFA Franc</option>
                <option value="GMD">GMD - Gambian Dalasi</option>
                <option value="GNF">GNF - Guinean Franc</option>
                <option value="SLL">SLL - Sierra Leonean Leone</option>
                <option value="LRD">LRD - Liberian Dollar</option>
                <option value="MRU">MRU - Mauritanian Ouguiya</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nisab Type
            </label>
            <select
              value={nisabType}
              onChange={(e) => setNisabType(e.target.value as 'gold' | 'silver')}
              className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent touch-manipulation"
            >
              <option value="gold">Gold (87.48g / 3 oz)</option>
              <option value="silver">Silver (612.36g / 20 oz)</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current {nisabType === 'gold' ? 'Gold' : 'Silver'} Price
              </label>
              <button
                onClick={fetchMetalPrices}
                disabled={isLoadingPrices}
                className="p-2 min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                title="Refresh prices"
              >
                <svg className={`w-5 h-5 ${isLoadingPrices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="min-h-[44px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-white flex items-center">
              {isLoadingPrices ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                `${formatCurrency((nisabType === 'gold' ? goldPrice : silverPrice) * (exchangeRates[currency] || 1))} per oz`
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nisab Threshold
            </label>
            <div className="min-h-[44px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-green-700 dark:text-green-400 font-semibold flex items-center">
              {formatCurrency(calculateNisab())}
            </div>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="bg-transparent dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Assets</h2>
        <div className="space-y-4">
          {assets.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-transparent dark:hover:bg-transparent transition-colors gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{asset.name}</h3>
                  {asset.isZakatable && (
                    <span className="px-2 py-1 text-xs bg-transparent dark:bg-transparent text-green-700 dark:text-green-400 rounded-full w-fit">
                      Zakatable
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{asset.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{currency}</span>
                <input
                  type="number"
                  value={asset.amount}
                  onChange={(e) => updateAsset(asset.id, parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-right touch-manipulation"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Liabilities Section */}
      <div className="bg-transparent dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Liabilities</h2>
        <div className="space-y-4">
          {liabilities.map((liability) => (
            <motion.div
              key={liability.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-transparent dark:hover:bg-transparent transition-colors gap-4"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{liability.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{liability.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{currency}</span>
                <input
                  type="number"
                  value={liability.amount}
                  onChange={(e) => updateLiability(liability.id, parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 min-h-[44px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-right touch-manipulation"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-transparent dark:bg-transparent rounded-xl border border-green-200 dark:border-green-700 p-4 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Zakat Calculation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Total Zakatable Assets:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculation.totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Total Liabilities:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculation.totalLiabilities)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Net Worth:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculation.netWorth)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">Nisab Threshold:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculation.nisab)}</span>
              </div>
            </div>

            {/* Zakat Result */}
            <div className="text-center space-y-4">
              <div className={`p-6 rounded-lg ${calculation.isEligible ? 'bg-transparent dark:bg-transparent' : 'bg-transparent dark:bg-transparent'}`}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {calculation.isEligible ? 'You are eligible for Zakat' : 'You are not eligible for Zakat'}
                </div>
                <div className={`text-3xl font-bold ${calculation.isEligible ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatCurrency(calculation.zakatAmount)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {calculation.zakatPercentage}% of net worth
                </div>
              </div>
              
              {calculation.isEligible && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>This amount should be distributed to eligible recipients according to Islamic guidelines.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hawl Warning */}
      <div className="bg-transparent dark:bg-transparent rounded-xl border border-amber-200 dark:border-amber-700 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">Critical: Hawl (Lunar Year) Requirement</h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Zakat is only due on wealth that has been in your possession for one complete lunar year (Hawl).</strong> 
              If you acquired any assets within the last 12 lunar months, they are not yet subject to Zakat. 
              Only include assets that have been held for a full lunar year or longer.
            </p>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-transparent dark:bg-transparent rounded-xl border border-blue-200 dark:border-blue-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Important Notes</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• <strong>Hawl (Lunar Year):</strong> Zakat is only due on wealth held for one complete lunar year</li>
          <li>• <strong>Basic Needs:</strong> Exclude personal residence, vehicles, household items, and basic necessities</li>
          <li>• <strong>Gold & Silver:</strong> All forms of gold and silver are zakatable regardless of purpose</li>
          <li>• <strong>Business Assets:</strong> Only include inventory and assets intended for sale</li>
          <li>• <strong>Investment Properties:</strong> Only rental income savings are zakatable, not the property itself</li>
          <li>• <strong>Liabilities:</strong> Only deduct immediate, short-term debts due within the Zakat year</li>
          <li>• <strong>Nisab:</strong> Based on 87.48g gold or 612.36g silver at current market prices</li>
          <li>• <strong>Rate:</strong> 2.5% of net zakatable wealth above Nisab threshold</li>
          <li>• <strong>Important:</strong> Consult a qualified Islamic scholar for complex situations</li>
        </ul>
      </div>
      </div>
    </motion.div>
  );
}
