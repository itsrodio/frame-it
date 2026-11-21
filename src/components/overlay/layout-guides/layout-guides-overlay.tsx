import { formatGuideColor } from '@/lib/guide-utils';
import type {
  GridGuideSettings,
  LayoutGuidesState,
  LinearGuideSettings,
} from '@/types/layout-guides';

function LinearGuideLayer({
  mode,
  settings,
  scrollX,
  scrollY,
}: {
  mode: 'columns' | 'rows';
  settings: LinearGuideSettings;
  scrollX: number;
  scrollY: number;
}) {
  const isColumns = mode === 'columns';
  const color = formatGuideColor(settings.color, settings.opacity);
  const isStretch = settings.alignment === 'stretch';

  const trackSize = isStretch
    ? 'minmax(0, 1fr)'
    : `${settings.itemSize ?? 64}px`;

  const justifyOrAlign =
    settings.alignment === 'start'
      ? 'start'
      : settings.alignment === 'end'
        ? 'end'
        : settings.alignment === 'center'
          ? 'center'
          : undefined;

  // Позиционирование самого контейнера сетки внутри вьюпорта
  const outerJustify =
    settings.alignment === 'start'
      ? 'flex-start'
      : settings.alignment === 'end'
        ? 'flex-end'
        : 'center';

  const scrollOffset = settings.followScroll
    ? isColumns
      ? -scrollX
      : -scrollY
    : 0;
  const totalOffset = settings.offset + scrollOffset;

  return (
    <div
      className="absolute inset-0 flex overflow-hidden"
      style={{
        flexDirection: isColumns ? 'row' : 'column',
        justifyContent: outerJustify,
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          maxWidth:
            isColumns && settings.maxSize !== null
              ? `${settings.maxSize}px`
              : undefined,
          maxHeight:
            !isColumns && settings.maxSize !== null
              ? `${settings.maxSize}px`
              : undefined,
          padding: isColumns
            ? `0 ${settings.margin}px`
            : `${settings.margin}px 0`,
          gap: `${settings.gutter}px`,
          gridTemplateColumns: isColumns
            ? `repeat(${settings.count}, ${trackSize})`
            : '1fr',
          gridTemplateRows: !isColumns
            ? `repeat(${settings.count}, ${trackSize})`
            : '1fr',
          justifyContent: isColumns ? justifyOrAlign : undefined,
          alignContent: !isColumns ? justifyOrAlign : undefined,
          transform:
            totalOffset !== 0
              ? isColumns
                ? `translateX(${totalOffset}px)`
                : `translateY(${totalOffset}px)`
              : undefined,
        }}
      >
        {Array.from(
          { length: settings.count },
          (_, i) => `${mode}-guide-${i}`,
        ).map((guideId) => (
          <div
            key={guideId}
            className="w-full h-full"
            style={{
              backgroundColor: color,
              borderInline: isColumns ? `1px solid ${color}` : undefined,
              borderBlock: !isColumns ? `1px solid ${color}` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GridGuideLayer({
  settings,
  scrollX,
  scrollY,
}: {
  settings: GridGuideSettings;
  scrollX: number;
  scrollY: number;
}) {
  const {
    size,
    color: rawColor,
    opacity,
    offsetX,
    offsetY,
    followScroll,
  } = settings;
  const color = formatGuideColor(rawColor, opacity);

  const posX = offsetX - (followScroll ? scrollX : 0);
  const posY = offsetY - (followScroll ? scrollY : 0);

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${posX}px ${posY}px`,
        backgroundImage: `
					linear-gradient(to right, ${color} 1px, transparent 1px),
					linear-gradient(to bottom, ${color} 1px, transparent 1px)
				`,
      }}
    />
  );
}

export interface LayoutGuidesOverlayProps {
  state: LayoutGuidesState;
  scroll: { x: number; y: number };
}

/**
 * Рендерит строго ОДИН активный тип сетки (state.type): Columns ИЛИ Rows ИЛИ Grid.
 */
export function LayoutGuidesOverlay({
  state,
  scroll,
}: LayoutGuidesOverlayProps) {
  if (!state.enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {state.type === 'grid' && (
        <GridGuideLayer
          settings={state.grid}
          scrollX={scroll.x}
          scrollY={scroll.y}
        />
      )}
      {state.type === 'rows' && (
        <LinearGuideLayer
          mode="rows"
          settings={state.rows}
          scrollX={scroll.x}
          scrollY={scroll.y}
        />
      )}
      {state.type === 'columns' && (
        <LinearGuideLayer
          mode="columns"
          settings={state.columns}
          scrollX={scroll.x}
          scrollY={scroll.y}
        />
      )}
    </div>
  );
}
