import type { SVGProps } from 'react';

const paths = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  chevronDown: <path d="m7 10 5 5 5-5" />,
  chevronLeft: <path d="m14 7-5 5 5 5" />,
  chevronRight: <path d="m10 7 5 5-5 5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  checkSquare: (
    <>
      <path d="m9 11.5 2 2 4-4" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M10 12h5M10 16h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.6-3.4 2.7-5 5.5-5s4.9 1.6 5.5 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 15c2 .5 3.2 2.1 3.5 5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 17 4.5-4.5L14 17l2.5-2.5L20 18" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5" />
      <path d="m14 8 4 4-4 4" />
      <path d="M9 12h9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-3.7 3.1-5.5 7-5.5s6.3 1.8 7 5.5" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 7 3v5c0 4.4-2.8 7.6-7 10-4.2-2.4-7-5.6-7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M19 14v5H5V5h5" />
    </>
  ),
  tag: (
    <>
      <path d="M11.6 3H4v7.6l8.7 8.7 7.6-7.6z" />
      <circle cx="7.6" cy="7.6" r="1.2" />
    </>
  ),
  type: (
    <>
      <path d="M5 5h14M12 5v14M8.5 19h7" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
