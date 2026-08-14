// Floria — StarRating component
// Renders 5 yellow stars with partial fill based on rating value
interface StarRatingProps {
  rating: number;        // 0-5
  count?: number;        // review count
  size?: "sm" | "md";
}

export function StarRating({ rating, count, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? 12 : 15;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const partial = !filled && i < rating;
    return { filled, partial };
  });

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" aria-hidden="true">
        {stars.map((s, i) => (
          <svg
            key={i}
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            className={s.filled || s.partial ? "text-amber-400" : "text-ink-100"}
          >
            <defs>
              {s.partial && (
                <linearGradient id={`star-partial-${i}`}>
                  <stop offset={`${(rating - Math.floor(rating)) * 100}%`} stopColor="currentColor" />
                  <stop offset={`${(rating - Math.floor(rating)) * 100}%`} stopColor="var(--color-ink-100)" />
                </linearGradient>
              )}
            </defs>
            <polygon
              points="8,1 10.2,6 15.5,6.3 11.5,10 12.7,15.3 8,12.5 3.3,15.3 4.5,10 0.5,6.3 5.8,6"
              fill={s.partial ? `url(#star-partial-${i})` : "currentColor"}
            />
          </svg>
        ))}
      </span>
      <span className="sr-only">{rating} out of 5 stars</span>
      {count !== undefined && (
        <span className="text-[11px] text-ink-400 font-ui">({count})</span>
      )}
    </span>
  );
}
