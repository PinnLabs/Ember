"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";

import { DEFAULT_CALENDAR_COLOR, EVENT_COLORS } from "@/lib/types";

const STORAGE_KEY = "ember:calendar:custom-event-colors";
const MAX_SAVED_COLORS = 12;
const HEX_COLOR = /^#[0-9a-f]{6}$/;
const PRESET_VALUES: readonly (string | null)[] = EVENT_COLORS.map((option) => option.value);

function readSavedColors(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((color) => typeof color === "string" && HEX_COLOR.test(color));
  } catch {
    return [];
  }
}

type EventColorPickerProps = {
  /** null means no override: the event uses its calendar's color. */
  value: string | null;
  onChange: (color: string | null) => void;
};

export function EventColorPicker({ value, onChange }: EventColorPickerProps) {
  const [savedColors, setSavedColors] = useState(readSavedColors);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedColor = value?.toLowerCase() ?? null;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // React's onChange fires on every drag tick; the native change event fires
    // once the picker closes, so only the final color is saved.
    function saveColor() {
      const color = input!.value.toLowerCase();
      if (PRESET_VALUES.includes(color)) return;
      const next = [color, ...readSavedColors().filter((saved) => saved !== color)].slice(0, MAX_SAVED_COLORS);
      setSavedColors(next);
      try {
        // shortcut: saved per browser, move to user preferences if colors must follow the user across devices.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be blocked; the color still applies to this event.
      }
    }
    input.addEventListener("change", saveColor);
    return () => input.removeEventListener("change", saveColor);
  }, []);

  const customColors = [...savedColors];
  // An event can carry a color this browser never saved, or one still being picked.
  if (selectedColor && !PRESET_VALUES.includes(selectedColor) && !customColors.includes(selectedColor)) {
    customColors.unshift(selectedColor);
  }

  const options = [
    ...EVENT_COLORS,
    ...customColors.map((color) => ({ name: `Custom color ${color}`, value: color })),
  ];

  return (
    <div className="event-dialog-swatches">
      {options.map((option) => {
        const selected = selectedColor === option.value;
        return (
          <button
            type="button"
            key={option.name}
            className={`event-swatch${selected ? " event-swatch--selected" : ""}`}
            style={{ background: option.value ?? "#6b7280" }}
            title={option.name}
            aria-label={option.name}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {selected && <Check size={12} strokeWidth={3} />}
          </button>
        );
      })}
      <label className="event-swatch event-swatch--add" title="Create a color">
        <Plus size={14} />
        <input
          ref={inputRef}
          type="color"
          aria-label="Create a color"
          value={selectedColor ?? DEFAULT_CALENDAR_COLOR}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
      </label>
    </div>
  );
}
