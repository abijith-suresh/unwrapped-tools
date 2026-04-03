import { type JSX, splitProps } from "solid-js";

type ToolActionButtonVariant = "primary" | "secondary" | "ghost";

interface ToolActionButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: ToolActionButtonVariant;
}

const BASE_STYLE: JSX.CSSProperties = {
  padding: "0.375rem 0.875rem",
  "border-radius": "0.375rem",
  border: "1px solid var(--border)",
  "font-size": "0.8125rem",
  "font-weight": "600",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
  "white-space": "nowrap",
};

const VARIANT_STYLES: Record<ToolActionButtonVariant, JSX.CSSProperties> = {
  primary: {
    background: "var(--accent-primary)",
    color: "var(--bg-primary)",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--bg-secondary)",
    color: "var(--text-secondary)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-muted)",
  },
};

const ACTIVE_STYLE: JSX.CSSProperties = {
  border: "1px solid var(--accent-primary)",
  background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
  color: "var(--accent-primary)",
};

export default function ToolActionButton(props: ToolActionButtonProps) {
  const [local, rest] = splitProps(props, ["active", "style", "type", "variant"]);
  const style = typeof local.style === "object" && local.style !== null ? local.style : {};

  return (
    <button
      {...rest}
      type={local.type ?? "button"}
      style={{
        ...BASE_STYLE,
        ...VARIANT_STYLES[local.variant ?? "secondary"],
        ...(local.active ? ACTIVE_STYLE : {}),
        ...style,
      }}
    />
  );
}
