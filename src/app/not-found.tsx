import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg 
            className="w-12 h-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          הדף לא נמצא
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          נראה שהדף שחיפשת לא קיים, הועבר, או שיש שגיאה בכתובת.
          <br />
          אל דאגה, אפשר לחזור לדף הבית.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-gray-900 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            חזרה לדף הבית
          </Link>
          <Link
            href="/tips"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
          >
            טיפים לשיפוץ
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-400 mt-12">
          צריך עזרה? <a href="mailto:support@shipazti.com" className="text-gray-600 hover:underline">צור קשר</a>
        </p>
      </div>
    </div>
  )
}
