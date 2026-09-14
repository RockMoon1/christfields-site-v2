'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { motion } from 'motion/react';
import { useId, useState, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string;
  /** Optional helper text rendered below the field. */
  hint?: string;
}

/**
 * Multi-line textarea with a label that floats up when focused or filled.
 * Companion to FloatingInput.
 *
 * Supports controlled mode (parent owns value via the standard value +
 * onChange props). Required for the message field that ties into a
 * character counter elsewhere in the form.
 */
export function FloatingTextarea({
  label,
  hint,
  id: idProp,
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  ...rest
}: FloatingTextareaProps) {
  const reduceMotion = useReducedMotion();
  const autoId = useId();
  const id = idProp || `field-${autoId}`;
  const hintId = `${id}-hint`;

  const [focused, setFocused] = useState(false);

  // If controlled, derive hasValue from prop. If uncontrolled, track internally.
  const isControlled = value !== undefined;
  const [internalHasValue, setInternalHasValue] = useState(Boolean(rest.defaultValue));
  const hasValue = isControlled ? String(value).length > 0 : internalHasValue;

  const floated = focused || hasValue;

  return (
    <div>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          {...rest}
          aria-describedby={[rest['aria-describedby'], hint ? hintId : undefined].filter(Boolean).join(' ') || undefined}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (!isControlled) setInternalHasValue(e.target.value.length > 0);
            onBlur?.(e);
          }}
          onChange={(e) => {
            if (!isControlled) setInternalHasValue(e.target.value.length > 0);
            onChange?.(e);
          }}
          className={cn('peer w-full resize-y rounded-sm border border-border-sub bg-black-3 px-4 pb-3 pt-7 text-base text-ivory [color-scheme:dark] transition-colors duration-200 focus:border-gold', className)}
        />
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: floated ? -10 : 0,
            scale: floated ? 0.8125 : 1,
            color: focused ? '#C9A548' : floated ? '#E4C97A' : '#8A9A92',
          }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left center' }}
          className="pointer-events-none absolute left-4 top-[1.15rem] origin-left text-base font-normal"
        >
          {label}
        </motion.label>
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}
