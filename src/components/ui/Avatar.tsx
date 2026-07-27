interface AvatarProps {
  name: string;
  size?: number;
  /** Photo (e.g. data URL) — shown instead of initials when present. */
  src?: string | null;
  /** Explicit initials (e.g. two-letter first+last) — overrides the default single-letter derivation from `name`. */
  initials?: string;
}

export function Avatar({ name, size = 40, src, initials }: AvatarProps) {
  const label = initials ?? name.trim().charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * (label.length > 1 ? 0.34 : 0.4) }}
    >
      {label}
    </div>
  );
}
