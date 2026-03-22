export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-3xl font-black text-white mb-2">404</h1>
        <p className="text-gray-400 text-sm">Page not found</p>
      </div>
    </div>
  );
}
