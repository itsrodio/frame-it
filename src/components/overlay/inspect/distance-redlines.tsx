import type { DistanceLine } from '@/lib/inspect-geometry';

export function DistanceRedlines({ lines }: { lines: DistanceLine[] }) {
  if (lines.length === 0) return null;

  return (
    <>
      <svg
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none"
      >
        {lines.map((line) => {
          const isHorizontal =
            line.direction === 'left' || line.direction === 'right';
          return (
            <g key={`${line.direction}-${line.x1}-${line.y1}`}>
              {line.guideLine && (
                <line
                  x1={line.guideLine.x1}
                  y1={line.guideLine.y1}
                  x2={line.guideLine.x2}
                  y2={line.guideLine.y2}
                  stroke="#F24E1E"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#F24E1E"
                strokeWidth="1.5"
              />

              {isHorizontal ? (
                <>
                  <line
                    x1={line.x1}
                    y1={line.y1 - 4}
                    x2={line.x1}
                    y2={line.y1 + 4}
                    stroke="#F24E1E"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={line.x2}
                    y1={line.y2 - 4}
                    x2={line.x2}
                    y2={line.y2 + 4}
                    stroke="#F24E1E"
                    strokeWidth="1.5"
                  />
                </>
              ) : (
                <>
                  <line
                    x1={line.x1 - 4}
                    y1={line.y1}
                    x2={line.x1 + 4}
                    y2={line.y1}
                    stroke="#F24E1E"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={line.x2 - 4}
                    y1={line.y2}
                    x2={line.x2 + 4}
                    y2={line.y2}
                    stroke="#F24E1E"
                    strokeWidth="1.5"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {lines.map((line) => {
        const centerX = (line.x1 + line.x2) / 2;
        const centerY = (line.y1 + line.y2) / 2;
        const isHorizontal =
          line.direction === 'left' || line.direction === 'right';

        return (
          <div
            key={`badge-${line.direction}-${line.x1}-${line.y1}`}
            className="fixed -translate-x-1/2 -translate-y-1/2 rounded bg-[#F24E1E] px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold text-white shadow-xs"
            style={{
              left: isHorizontal ? centerX : centerX + 18,
              top: isHorizontal ? centerY - 12 : centerY,
            }}
          >
            {line.value}
          </div>
        );
      })}
    </>
  );
}
