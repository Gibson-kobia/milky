'use client';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-red-700">Something went wrong</h1>
        <p className="mt-4 text-sm text-gray-700">{error.message}</p>
        <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-800">
          {error.stack}
        </pre>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-milk-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-milk-green-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
