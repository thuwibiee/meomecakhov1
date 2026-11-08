// High-quality crisp 2D Pixel Art SVG Data-URI Placeholders for Fishing Minigame
// Rendered strictly with shape-rendering="crispEdges" and pixel grid alignment

// 1. Pixel Fisherman Cat with Straw Hat & Fishing Rod
export const DEFAULT_PIXEL_CAT_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96" shape-rendering="crispEdges">
  <!-- Fisherman Straw Hat -->
  <rect x="14" y="8" width="20" height="4" fill="#F7DDA0"/>
  <rect x="16" y="5" width="16" height="3" fill="#DDA15E"/>
  <rect x="18" y="7" width="12" height="2" fill="#FF8FAB"/>

  <!-- Cat Ears -->
  <rect x="13" y="10" width="4" height="4" fill="#E76F51"/>
  <rect x="14" y="11" width="2" height="2" fill="#FFB3C6"/>
  <rect x="31" y="10" width="4" height="4" fill="#E76F51"/>
  <rect x="32" y="11" width="2" height="2" fill="#FFB3C6"/>

  <!-- Cat Head -->
  <rect x="15" y="12" width="18" height="13" fill="#F4A261"/>
  <!-- Cheeks blush -->
  <rect x="16" y="19" width="3" height="2" fill="#FF8FAB"/>
  <rect x="29" y="19" width="3" height="2" fill="#FF8FAB"/>
  <!-- Eyes -->
  <rect x="19" y="16" width="3" height="4" fill="#795653"/>
  <rect x="19" y="16" width="1" height="1" fill="#FFFFFF"/>
  <rect x="26" y="16" width="3" height="4" fill="#795653"/>
  <rect x="26" y="16" width="1" height="1" fill="#FFFFFF"/>
  <!-- Nose & Mouth -->
  <rect x="23" y="18" width="2" height="1" fill="#E76F51"/>
  <rect x="22" y="20" width="1" height="1" fill="#795653"/>
  <rect x="23" y="20" width="2" height="1" fill="#795653"/>
  <rect x="25" y="20" width="1" height="1" fill="#795653"/>
  <!-- Whiskers -->
  <rect x="13" y="18" width="2" height="1" fill="#795653"/>
  <rect x="13" y="20" width="2" height="1" fill="#795653"/>
  <rect x="33" y="18" width="2" height="1" fill="#795653"/>
  <rect x="33" y="20" width="2" height="1" fill="#795653"/>

  <!-- Body -->
  <rect x="16" y="25" width="16" height="15" fill="#F4A261"/>
  <rect x="20" y="26" width="8" height="11" fill="#FFF9F4"/>

  <!-- Arm holding rod -->
  <rect x="27" y="27" width="5" height="4" fill="#E76F51"/>
  <!-- Fishing Rod (Pixelated) -->
  <rect x="30" y="16" width="2" height="14" fill="#9C6644"/>
  <rect x="32" y="10" width="2" height="8" fill="#9C6644"/>
  <rect x="34" y="4" width="2" height="8" fill="#9C6644"/>
  <rect x="36" y="2" width="2" height="4" fill="#DDA15E"/>
  <!-- Fishing Line -->
  <rect x="38" y="2" width="1" height="2" fill="#FFFFFF"/>
  <rect x="39" y="4" width="1" height="4" fill="#FFFFFF"/>
  <rect x="40" y="8" width="1" height="12" fill="#FFFFFF"/>
  <rect x="41" y="20" width="1" height="16" fill="#FFFFFF"/>

  <!-- Tail -->
  <rect x="11" y="32" width="5" height="3" fill="#E76F51"/>
  <rect x="9" y="27" width="3" height="6" fill="#F4A261"/>
  <rect x="8" y="24" width="3" height="4" fill="#E76F51"/>

  <!-- Paws -->
  <rect x="17" y="39" width="5" height="3" fill="#FFF9F4"/>
  <rect x="26" y="39" width="5" height="3" fill="#FFF9F4"/>
</svg>
`)}`;

// 2. Pixel Wooden Dock / Pier Platform from user reference
export const PIXEL_WOODEN_PIER = '/assets/fishing/wooden_pier_full.png';
export const PIXEL_GRASS_BANK_TILE = '/assets/fishing/grass_bank_seamless.png';
export const DEFAULT_PIXEL_DOCK_PLACEHOLDER = '/assets/fishing/wooden_pier_full.png';

export const BACKUP_PIXEL_DOCK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 28" width="160" height="56" shape-rendering="crispEdges">
  <!-- Wooden Planks Top Surface -->
  <rect x="0" y="4" width="80" height="10" fill="#DDA15E"/>
  <rect x="0" y="2" width="80" height="2" fill="#F7DDA0"/>
  <rect x="0" y="14" width="80" height="2" fill="#BC6C25"/>

  <!-- Plank Divisions -->
  <rect x="16" y="2" width="2" height="14" fill="#795653"/>
  <rect x="32" y="2" width="2" height="14" fill="#795653"/>
  <rect x="48" y="2" width="2" height="14" fill="#795653"/>
  <rect x="64" y="2" width="2" height="14" fill="#795653"/>

  <!-- Nails / Screws -->
  <rect x="6" y="5" width="2" height="2" fill="#795653"/>
  <rect x="6" y="11" width="2" height="2" fill="#795653"/>
  <rect x="22" y="5" width="2" height="2" fill="#795653"/>
  <rect x="22" y="11" width="2" height="2" fill="#795653"/>
  <rect x="38" y="5" width="2" height="2" fill="#795653"/>
  <rect x="38" y="11" width="2" height="2" fill="#795653"/>
  <rect x="54" y="5" width="2" height="2" fill="#795653"/>
  <rect x="54" y="11" width="2" height="2" fill="#795653"/>
  <rect x="70" y="5" width="2" height="2" fill="#795653"/>
  <rect x="70" y="11" width="2" height="2" fill="#795653"/>

  <!-- Pier Wooden Pilings / Posts -->
  <rect x="8" y="16" width="10" height="12" fill="#9C6644"/>
  <rect x="8" y="16" width="3" height="12" fill="#BC6C25"/>
  <rect x="15" y="16" width="3" height="12" fill="#795653"/>

  <rect x="35" y="16" width="10" height="12" fill="#9C6644"/>
  <rect x="35" y="16" width="3" height="12" fill="#BC6C25"/>
  <rect x="42" y="16" width="3" height="12" fill="#795653"/>

  <rect x="62" y="16" width="10" height="12" fill="#9C6644"/>
  <rect x="62" y="16" width="3" height="12" fill="#BC6C25"/>
  <rect x="69" y="16" width="3" height="12" fill="#795653"/>

  <!-- Water contact moss / dark line -->
  <rect x="6" y="26" width="14" height="2" fill="#526C91"/>
  <rect x="33" y="26" width="14" height="2" fill="#526C91"/>
  <rect x="60" y="26" width="14" height="2" fill="#526C91"/>
</svg>
`)}`;

// 3. Pixel Caught Fish (Bubble Fish with Shimmer Sparkles)
export const DEFAULT_PIXEL_FISH_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="80" height="80" shape-rendering="crispEdges">
  <!-- Fish Tail -->
  <rect x="4" y="15" width="6" height="10" fill="#FF8FAB"/>
  <rect x="2" y="13" width="4" height="4" fill="#FFB3C6"/>
  <rect x="2" y="23" width="4" height="4" fill="#FFB3C6"/>
  <rect x="6" y="18" width="4" height="4" fill="#FF8FAB"/>

  <!-- Main Body (Chubby Pastel Pink Fish) -->
  <rect x="10" y="11" width="22" height="18" fill="#FF8FAB"/>
  <rect x="12" y="9" width="18" height="22" fill="#FF8FAB"/>
  <rect x="14" y="7" width="14" height="26" fill="#FF8FAB"/>

  <!-- Belly Highlight -->
  <rect x="14" y="23" width="14" height="7" fill="#FFE5EC"/>
  <rect x="16" y="25" width="10" height="4" fill="#FFF9F4"/>

  <!-- Top Fin -->
  <rect x="18" y="4" width="8" height="4" fill="#FFB3C6"/>
  <rect x="20" y="2" width="4" height="3" fill="#FFE5EC"/>

  <!-- Big Cute Eye -->
  <rect x="26" y="13" width="5" height="5" fill="#795653"/>
  <rect x="27" y="14" width="2" height="2" fill="#FFFFFF"/>
  <rect x="30" y="16" width="1" height="1" fill="#FFFFFF"/>

  <!-- Cheek Blush -->
  <rect x="24" y="20" width="4" height="2" fill="#D6336C"/>

  <!-- Pouty Mouth -->
  <rect x="34" y="18" width="3" height="3" fill="#D6336C"/>

  <!-- Shiny Sparkles / Bubbles -->
  <rect x="34" y="8" width="2" height="2" fill="#FFF9F4"/>
  <rect x="36" y="10" width="2" height="2" fill="#FFF9F4"/>
  <rect x="6" y="7" width="2" height="2" fill="#A9C5F2"/>
  <rect x="4" y="29" width="3" height="3" fill="#A9C5F2"/>
</svg>
`)}`;
