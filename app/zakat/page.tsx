import ZakatCalculator from '../components/ZakatCalculator';
import AskBar from '../mosques/AskBar';

export default function ZakatCalculatorPage() {
  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Main feature */}
        <ZakatCalculator />
      </div>

      {/* Bottom Ask QuranGPT input */}
      <AskBar />
    </>
  );
}
