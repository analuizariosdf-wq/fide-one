import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Wraps a single form control with a properly associated <Label>.
 * The id is cloned onto the child when it's a native input/textarea; for
 * composite controls (e.g. our Select) the trigger takes its own
 * `aria-label` at the call site instead, since there's no DOM node to
 * attach `id` to on the Radix root.
 */
export function FormField({ label, required, children }: FormFieldProps) {
  const id = useId();
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, { id })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {child}
    </div>
  );
}
