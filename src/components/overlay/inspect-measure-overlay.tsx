import { useEffect, useRef, useState } from 'react';
import {
	getElementLabel,
	isEditableTarget,
	isOverlayElement,
} from '@/lib/dom-utils';

interface DistanceLine {
	direction: 'top' | 'right' | 'bottom' | 'left';
	value: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	guideLine?: {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};
}

interface BoxPadding {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface InspectMeasureOverlayProps {
	active: boolean;
	onSnapToElement?: (el: HTMLElement) => void;
	onCancel?: () => void;
}

function parsePadding(el: HTMLElement): BoxPadding {
	const style = window.getComputedStyle(el);
	return {
		top: Math.round(Number.parseFloat(style.paddingTop) || 0),
		right: Math.round(Number.parseFloat(style.paddingRight) || 0),
		bottom: Math.round(Number.parseFloat(style.paddingBottom) || 0),
		left: Math.round(Number.parseFloat(style.paddingLeft) || 0),
	};
}

/**
 * Вычисляет расстояния в пикселях от sourceRect до targetRect (как по Alt в Figma).
 * Поддерживает два случая:
 * 1. Непересекающиеся элементы (внешние расстояния по X и Y + пунктирные проекции).
 * 2. Вложенные/пересекающиеся элементы (расстояния до 4 внутренних граней родителя или экрана).
 */
function calculateDistances(source: DOMRect, target: DOMRect): DistanceLine[] {
	const lines: DistanceLine[] = [];
	const midX = source.left + source.width / 2;
	const midY = source.top + source.height / 2;

	const separatedLeft = target.right <= source.left;
	const separatedRight = target.left >= source.right;
	const separatedTop = target.bottom <= source.top;
	const separatedBottom = target.top >= source.bottom;

	// Если элементы разделены снаружи (sibling / другой блок на странице)
	if (separatedLeft || separatedRight || separatedTop || separatedBottom) {
		if (separatedLeft) {
			const dist = Math.round(source.left - target.right);
			if (dist > 0) {
				const guideY =
					midY < target.top
						? target.top
						: midY > target.bottom
							? target.bottom
							: null;
				lines.push({
					direction: 'left',
					value: dist,
					x1: target.right,
					y1: midY,
					x2: source.left,
					y2: midY,
					guideLine:
						guideY !== null
							? { x1: target.right, y1: guideY, x2: target.right, y2: midY }
							: undefined,
				});
			}
		} else if (separatedRight) {
			const dist = Math.round(target.left - source.right);
			if (dist > 0) {
				const guideY =
					midY < target.top
						? target.top
						: midY > target.bottom
							? target.bottom
							: null;
				lines.push({
					direction: 'right',
					value: dist,
					x1: source.right,
					y1: midY,
					x2: target.left,
					y2: midY,
					guideLine:
						guideY !== null
							? { x1: target.left, y1: guideY, x2: target.left, y2: midY }
							: undefined,
				});
			}
		}

		if (separatedTop) {
			const dist = Math.round(source.top - target.bottom);
			if (dist > 0) {
				const guideX =
					midX < target.left
						? target.left
						: midX > target.right
							? target.right
							: null;
				lines.push({
					direction: 'top',
					value: dist,
					x1: midX,
					y1: target.bottom,
					x2: midX,
					y2: source.top,
					guideLine:
						guideX !== null
							? { x1: guideX, y1: target.bottom, x2: midX, y2: target.bottom }
							: undefined,
				});
			}
		} else if (separatedBottom) {
			const dist = Math.round(target.top - source.bottom);
			if (dist > 0) {
				const guideX =
					midX < target.left
						? target.left
						: midX > target.right
							? target.right
							: null;
				lines.push({
					direction: 'bottom',
					value: dist,
					x1: midX,
					y1: source.bottom,
					x2: midX,
					y2: target.top,
					guideLine:
						guideX !== null
							? { x1: guideX, y1: target.top, x2: midX, y2: target.top }
							: undefined,
				});
			}
		}

		return lines;
	}

	// Иначе один элемент находится внутри другого (или пересекается) — меряем 4 стороны до граней
	const topDist = Math.round(Math.abs(source.top - target.top));
	if (topDist > 0) {
		lines.push({
			direction: 'top',
			value: topDist,
			x1: midX,
			y1: Math.min(source.top, target.top),
			x2: midX,
			y2: Math.max(source.top, target.top),
		});
	}

	const bottomDist = Math.round(Math.abs(target.bottom - source.bottom));
	if (bottomDist > 0) {
		lines.push({
			direction: 'bottom',
			value: bottomDist,
			x1: midX,
			y1: Math.min(source.bottom, target.bottom),
			x2: midX,
			y2: Math.max(source.bottom, target.bottom),
		});
	}

	const leftDist = Math.round(Math.abs(source.left - target.left));
	if (leftDist > 0) {
		lines.push({
			direction: 'left',
			value: leftDist,
			x1: Math.min(source.left, target.left),
			y1: midY,
			x2: Math.max(source.left, target.left),
			y2: midY,
		});
	}

	const rightDist = Math.round(Math.abs(target.right - source.right));
	if (rightDist > 0) {
		lines.push({
			direction: 'right',
			value: rightDist,
			x1: Math.min(source.right, target.right),
			y1: midY,
			x2: Math.max(source.right, target.right),
			y2: midY,
		});
	}

	return lines;
}

export function InspectMeasureOverlay({
	active,
	onSnapToElement,
	onCancel,
}: InspectMeasureOverlayProps) {
	const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
	const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
	const [isAltPressed, setIsAltPressed] = useState(false);
	const [, setTick] = useState(0);

	const activeRef = useRef(active);
	activeRef.current = active;

	const selectedElRef = useRef<HTMLElement | null>(selectedEl);
	selectedElRef.current = selectedEl;

	const isAltPressedRef = useRef(isAltPressed);
	isAltPressedRef.current = isAltPressed;

	useEffect(() => {
		if (!active) {
			setSelectedEl(null);
			setHoveredEl(null);
		}
	}, [active]);

	useEffect(() => {
		let moveRafId: number | null = null;
		let layoutRafId: number | null = null;
		let pendingPoint: { x: number; y: number } | null = null;

		const updateAltState = (pressed: boolean) => {
			if (isAltPressedRef.current === pressed) return;
			isAltPressedRef.current = pressed;
			setIsAltPressed(pressed);
			if (!pressed && !activeRef.current) {
				setHoveredEl(null);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (isEditableTarget(e.target)) return;

			if (e.key === 'Alt') {
				updateAltState(true);
			} else if (e.key === 'Escape') {
				if (selectedElRef.current) {
					e.preventDefault();
					setSelectedEl(null);
				} else if (activeRef.current && onCancel) {
					e.preventDefault();
					onCancel();
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Alt') {
				updateAltState(false);
			}
		};

		const handleBlur = () => {
			updateAltState(false);
		};

		const processMouseMove = () => {
			moveRafId = null;
			if (!pendingPoint) return;

			const target = document.elementFromPoint(pendingPoint.x, pendingPoint.y);
			if (
				!target ||
				!(target instanceof HTMLElement) ||
				isOverlayElement(target)
			) {
				setHoveredEl(null);
				return;
			}
			setHoveredEl((prev) => (prev === target ? prev : target));
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!activeRef.current && !e.altKey && !isAltPressedRef.current) return;
			if (e.altKey !== isAltPressedRef.current) {
				updateAltState(e.altKey);
			}

			pendingPoint = { x: e.clientX, y: e.clientY };
			if (moveRafId === null) {
				moveRafId = window.requestAnimationFrame(processMouseMove);
			}
		};

		const handleClick = (e: MouseEvent) => {
			if (!activeRef.current && !e.altKey) return;
			const target = e.target as Element | null;
			if (isOverlayElement(target) || !(target instanceof HTMLElement)) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			// Shift + Click в режиме Inspect мгновенно подстраивает сетку под этот контейнер
			if (e.shiftKey && onSnapToElement) {
				onSnapToElement(target);
				return;
			}

			setSelectedEl((prev) => (prev === target ? null : target));
		};

		const handleScrollOrResize = () => {
			if (!activeRef.current && !isAltPressedRef.current) return;
			if (layoutRafId !== null) return;
			layoutRafId = window.requestAnimationFrame(() => {
				layoutRafId = null;
				setTick((t) => t + 1);
			});
		};

		window.addEventListener('keydown', handleKeyDown, true);
		window.addEventListener('keyup', handleKeyUp, true);
		window.addEventListener('blur', handleBlur);
		window.addEventListener('mousemove', handleMouseMove, true);
		window.addEventListener('click', handleClick, true);
		window.addEventListener('scroll', handleScrollOrResize, {
			passive: true,
			capture: true,
		});
		window.addEventListener('resize', handleScrollOrResize, { passive: true });

		return () => {
			if (moveRafId !== null) window.cancelAnimationFrame(moveRafId);
			if (layoutRafId !== null) window.cancelAnimationFrame(layoutRafId);
			window.removeEventListener('keydown', handleKeyDown, true);
			window.removeEventListener('keyup', handleKeyUp, true);
			window.removeEventListener('blur', handleBlur);
			window.removeEventListener('mousemove', handleMouseMove, true);
			window.removeEventListener('click', handleClick, true);
			window.removeEventListener('scroll', handleScrollOrResize, true);
			window.removeEventListener('resize', handleScrollOrResize);
		};
	}, [onCancel, onSnapToElement]);

	const isVisible = active || isAltPressed;
	if (!isVisible) return null;

	const validSelected =
		selectedEl && document.body.contains(selectedEl) ? selectedEl : null;
	const validHovered =
		hoveredEl && document.body.contains(hoveredEl) ? hoveredEl : null;

	// Определяем пару для измерения расстояний (как в Figma):
	// 1. Если есть выбранный элемент (validSelected) и мы навели на другой (validHovered) -> меряем от selected до hovered.
	// 2. Иначе если навели на элемент -> меряем от hovered до его прямого родителя.
	const sourceEl = validSelected ?? validHovered;
	const targetEl =
		validSelected && validHovered && validSelected !== validHovered
			? validHovered
			: validHovered?.parentElement &&
					validHovered.parentElement !== document.documentElement
				? validHovered.parentElement
				: null;

	const sourceRect = sourceEl?.getBoundingClientRect() ?? null;
	const targetRect = targetEl?.getBoundingClientRect() ?? null;
	const hoveredPadding = validHovered ? parsePadding(validHovered) : null;

	const showDistances =
		(isAltPressed || (active && validSelected !== null)) &&
		sourceRect !== null &&
		targetRect !== null &&
		sourceEl !== targetEl;

	const distanceLines =
		showDistances && sourceRect && targetRect
			? calculateDistances(sourceRect, targetRect)
			: [];

	return (
		<div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
			{/* Подсказка режима Inspect */}
			{active && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-popover/95 px-3.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border backdrop-blur-xs">
					<span>
						<strong className="font-semibold">Click</strong> element to lock •{' '}
						<kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
							Alt
						</kbd>{' '}
						measure distances •{' '}
						<kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
							Shift+Click
						</kbd>{' '}
						snap grid to container •{' '}
						<kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
							Esc
						</kbd>{' '}
						exit
					</span>
				</div>
			)}

			{/* Рамка родителя / второго элемента при измерении */}
			{showDistances && targetRect && targetEl !== validHovered && (
				<div
					className="fixed border border-dashed border-[#F24E1E]/70"
					style={{
						top: targetRect.top,
						left: targetRect.left,
						width: targetRect.width,
						height: targetRect.height,
					}}
				/>
			)}

			{/* Рамка зафиксированного (выбранного кликом) элемента */}
			{validSelected && sourceRect && (
				<div
					className="fixed border-2 border-[#0D99FF] bg-[#0D99FF]/5"
					style={{
						top: sourceRect.top,
						left: sourceRect.left,
						width: sourceRect.width,
						height: sourceRect.height,
					}}
				>
					<div className="absolute -top-6 left-0 flex items-center gap-1 rounded bg-[#0D99FF] px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-xs">
						<span className="font-mono">{getElementLabel(validSelected)}</span>
						<span className="opacity-75">•</span>
						<span>
							{Math.round(sourceRect.width)} × {Math.round(sourceRect.height)}
						</span>
					</div>
				</div>
			)}

			{/* Рамка элемента под курсором + его внутренние padding */}
			{validHovered &&
				(() => {
					const rect = validHovered.getBoundingClientRect();
					const isSameAsSelected = validHovered === validSelected;
					return (
						<div
							className={
								isSameAsSelected
									? 'fixed'
									: 'fixed border border-[#F24E1E] bg-[#F24E1E]/5'
							}
							style={{
								top: rect.top,
								left: rect.left,
								width: rect.width,
								height: rect.height,
							}}
						>
							{/* Подсветка внутренних паддингов элемента */}
							{hoveredPadding && hoveredPadding.top > 0 && (
								<div
									className="absolute inset-x-0 top-0 bg-emerald-500/15"
									style={{ height: hoveredPadding.top }}
								/>
							)}
							{hoveredPadding && hoveredPadding.bottom > 0 && (
								<div
									className="absolute inset-x-0 bottom-0 bg-emerald-500/15"
									style={{ height: hoveredPadding.bottom }}
								/>
							)}
							{hoveredPadding && hoveredPadding.left > 0 && (
								<div
									className="absolute inset-y-0 left-0 bg-emerald-500/15"
									style={{ width: hoveredPadding.left }}
								/>
							)}
							{hoveredPadding && hoveredPadding.right > 0 && (
								<div
									className="absolute inset-y-0 right-0 bg-emerald-500/15"
									style={{ width: hoveredPadding.right }}
								/>
							)}

							{!isSameAsSelected && (
								<div className="absolute -bottom-6 left-0 flex items-center gap-1 rounded bg-[#F24E1E] px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-xs z-10">
									<span className="font-mono">
										{getElementLabel(validHovered)}
									</span>
									<span className="opacity-75">•</span>
									<span>
										{Math.round(rect.width)} × {Math.round(rect.height)}
									</span>
								</div>
							)}
						</div>
					);
				})()}

			{/* SVG-линии расстояний и бейджи с пикселями (Figma Redlines #F24E1E) */}
			{distanceLines.length > 0 && (
				<>
					<svg
						aria-hidden="true"
						className="fixed inset-0 w-full h-full pointer-events-none"
					>
						{distanceLines.map((line) => {
							const isHorizontal =
								line.direction === 'left' || line.direction === 'right';
							return (
								<g key={`${line.direction}-${line.x1}-${line.y1}`}>
									{/* Пунктирная проекционная линия до грани второго объекта */}
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

									{/* Основная линия измерения */}
									<line
										x1={line.x1}
										y1={line.y1}
										x2={line.x2}
										y2={line.y2}
										stroke="#F24E1E"
										strokeWidth="1.5"
									/>

									{/* Засечки (caps) на концах линии */}
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

					{/* Плашки со значениями в px */}
					{distanceLines.map((line) => {
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
			)}
		</div>
	);
}
