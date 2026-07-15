export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 p-8 md:p-24">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Free Scraper API
          </h1>
          <p className="text-xl text-gray-400">
            A zero-cost, high-performance web extraction engine for developers, AI startups, and SaaS platforms.
          </p>
        </header>

        <section className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-white">How to use it</h2>
          <p>Send a GET request to our endpoint. Pass the <code className="text-green-400 bg-black px-2 py-1 rounded">url</code> you want to scrape, and an optional <code className="text-green-400 bg-black px-2 py-1 rounded">extract</code> parameter with JSON CSS selectors.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Use Case 1 */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-xl font-bold text-blue-400">🛒 E-commerce & Pricing</h3>
            <p className="text-sm text-gray-400">Track competitors by extracting prices and titles.</p>
            <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-green-300">
              {`/api/scrape?url=https://example.com/product&extract={"price":".price","title":"h1"}`}
            </pre>
          </div>

          {/* Use Case 2 */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-xl font-bold text-purple-400">🔍 SEO Monitoring</h3>
            <p className="text-sm text-gray-400">Extract meta descriptions and title tags instantly.</p>
            <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-green-300">
              {`/api/scrape?url=https://example.com&extract={"title":"title","desc":"meta[name='description']"}`}
            </pre>
          </div>

          {/* Use Case 3 */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-xl font-bold text-yellow-400">💼 Job Boards & HR</h3>
            <p className="text-sm text-gray-400">Gather job listings and salary data dynamically.</p>
            <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-green-300">
              {`/api/scrape?url=https://example-jobs.com&extract={"role":".job-title","salary":".compensation"}`}
            </pre>
          </div>

          {/* Use Case 4 */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-xl font-bold text-red-400">🤖 AI Training Data</h3>
            <p className="text-sm text-gray-400">Pull raw HTML text dumps for LLM context windows.</p>
            <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-green-300">
              {`/api/scrape?url=https://example.com`}
            </pre>
          </div>
        </div>

      </div>
    </main>
  );
}
