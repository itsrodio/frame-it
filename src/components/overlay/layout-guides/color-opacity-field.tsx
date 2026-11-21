import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';

export interface ColorOpacityFieldProps {
  cleanHex: string;
  validCssHex: string;
  opacity: number;
  onHexChange: (value: string) => void;
  onOpacityChange: (value: string) => void;
}

export function ColorOpacityField({
  cleanHex,
  validCssHex,
  opacity,
  onHexChange,
  onOpacityChange,
}: ColorOpacityFieldProps) {
  return (
    <Field orientation="horizontal">
      <FieldLabel
        htmlFor="guide-color"
        className="w-2/5 text-xs text-muted-foreground"
      >
        {i18n.t('guides.fields.color')}
      </FieldLabel>

      {/* Composite control: [Swatch | HEX | Opacity %] */}
      <InputGroup className="h-7 w-3/5 shadow-none">
        <InputGroupAddon align="inline-start" className="pl-1.5 pr-0">
          {/* Split swatch (solid vs alpha checkerboard) wrapping native color picker */}
          <label className="relative flex size-4 shrink-0 cursor-pointer overflow-hidden rounded-[3px] border border-border/60">
            <span
              className="h-full w-1/2"
              style={{ backgroundColor: validCssHex }}
            />
            <span
              className="relative h-full w-1/2"
              style={{
                backgroundImage:
                  'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)',
                backgroundSize: '6px 6px',
              }}
            >
              <span
                className="absolute inset-0"
                style={{
                  backgroundColor: validCssHex,
                  opacity: opacity / 100,
                }}
              />
            </span>
            <input
              type="color"
              value={validCssHex}
              onChange={(e) => onHexChange(e.target.value)}
              className="sr-only"
              aria-label={i18n.t('guides.fields.pickColorAriaLabel')}
            />
          </label>
        </InputGroupAddon>

        <InputGroupInput
          id="guide-color"
          type="text"
          value={cleanHex}
          onChange={(e) => onHexChange(e.target.value)}
          maxLength={6}
          className="min-w-0 px-1.5 font-mono text-xs uppercase"
        />

        <InputGroupAddon
          align="inline-end"
          className="h-full shrink-0 gap-0 border-l border-input px-1.5"
        >
          <input
            type="number"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => onOpacityChange(e.target.value)}
            aria-label={i18n.t('guides.fields.opacityAriaLabel')}
            className="w-7 bg-transparent text-right text-xs text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <InputGroupText className="ml-0.5 text-xs">%</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
