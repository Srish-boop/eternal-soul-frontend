export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-400">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Go Home
        </a>
      </div>
    </main>
  );
} 