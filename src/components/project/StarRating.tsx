'use client';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({ rating, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`text-xl ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          disabled={readonly}
        >
          {star <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
