import React from 'react';

export const XU_CA_LOGO_URL = 'https://i.postimg.cc/X71LdHn6/a5eaf726-8a19-4917-8cf3-e071a9034c05.png';

interface XuCaIconProps {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const XuCaIcon: React.FC<XuCaIconProps> = ({
  className = 'w-4 h-4 inline-block object-contain align-middle',
  alt = 'Xu Cá',
  style,
}) => {
  return (
    <img
      src={XU_CA_LOGO_URL}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={(e) => {
        // Fallback in case image fails to load
        (e.currentTarget as HTMLElement).style.display = 'none';
      }}
    />
  );
};
