interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
