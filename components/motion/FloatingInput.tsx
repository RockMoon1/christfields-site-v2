'use client';

import { motion } from 'framer-motion';
import { useId, useState, type InputHTMLAttributes } from 'react';

interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
}

/**
 * Text-like input with a label that floats up into the top of the field
 * when focused or filled. Modern form pattern. No need for separate
 * <label> markup elsewhere; the label is part of the field itself.
 *
 * Stays accessible: a real <label htmlFor=id> wraps the floating text,
 * the input has the matching id, and clicking the label focuses the input.
 */
export function FloatingInput({ label, id: idProp, onChange, onFocus, onBlur, ...rest }: FloatingInputProps) {
  const autoId = useId();
  const id = idProp || `field-${autoId}`;

  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(rest.defaultValue));

  const floated = focused || hasValue;

  return (
    <div className="relative">
      <input
        id={id}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setHasValue(e.target.value.length > 0);
          onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          onChange?.(e);
        }}
        className="peer w-full rounded-sm border border-border-sub bg-black-3 px-4 pb-2 pt-6 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
      />
      <motion.label
        htmlFor={id}
        initial={false}
        animate={{
          y: floated ? -10 : 0,
          scale: floated ? 0.78 : 1,
          color: focused ? '#C9A548' : floated ? '#E4C97A' : '#8A9A92',
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left center' }}
        className="pointer-events-none absolute left-4 top-[1.05rem] origin-left text-sm font-normal"
      >
        {label}
      </motion.label>
    </div>
  );
}
