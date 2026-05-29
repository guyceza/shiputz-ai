'use client';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({ rating, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1" aria-label={`דירוג ${rating} מתוך 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-transform ${
            star <= rating
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-gray-200 bg-white text-gray-400"
          } ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          disabled={readonly}
          aria-label={`דירוג ${star}`}
        >
          {star}
        </button>
      ))}
    </div>
  );
}
