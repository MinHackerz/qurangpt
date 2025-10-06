import MosqueFinder from '../components/MosqueFinder';
import AskBar from './AskBar';

export default function MosqueFinderPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 pb-28">
        {/* Main feature */}
        <MosqueFinder />
      </div>

      {/* Bottom Ask QuranGPT input with 20px padding */}
      <AskBar />
    </>
  );
}


