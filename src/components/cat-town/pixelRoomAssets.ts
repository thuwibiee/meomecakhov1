// Bộ Asset Đồ Họa Pixel 2D/2.5D Căn Nhà Mèo (Cat House)
// Được xuất dưới dạng Image Data URI pixelated chuẩn RPG Retro

// CỬA SỔ GỖ PIXEL CÓ RÈM PASTEL & ÁNH NẮNG CHIẾU
export const PIXEL_WINDOW_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" style="shape-rendering: crispEdges;">
  <!-- Khung viền gỗ ngoài -->
  <rect x="4" y="4" width="40" height="40" fill="#795653" />
  <rect x="6" y="6" width="36" height="36" fill="#A47551" />
  <rect x="8" y="8" width="32" height="32" fill="#5C3D2E" />
  
  <!-- Bầu trời bên ngoài -->
  <rect x="10" y="10" width="28" height="28" fill="#BEE1E6" />
  <!-- Mây trắng pixel -->
  <rect x="14" y="14" width="8" height="4" fill="#FFFFFF" />
  <rect x="12" y="16" width="12" height="3" fill="#FFFFFF" />
  <rect x="26" y="20" width="8" height="3" fill="#FFFFFF" />
  
  <!-- Ánh nắng vàng xiên qua -->
  <polygon points="10,10 18,10 38,30 38,38" fill="#FFF3B0" opacity="0.4" />
  
  <!-- Khung chia ô cửa sổ gỗ -->
  <rect x="23" y="10" width="2" height="28" fill="#A47551" />
  <rect x="10" y="23" width="28" height="2" fill="#A47551" />
  
  <!-- Rèm vải hồng pastel hai bên -->
  <rect x="8" y="8" width="6" height="26" fill="#FFB3C6" />
  <rect x="10" y="8" width="3" height="22" fill="#FFE5EC" />
  <rect x="34" y="8" width="6" height="26" fill="#FFB3C6" />
  <rect x="35" y="8" width="3" height="22" fill="#FFE5EC" />
  <!-- Nơ buộc rèm -->
  <rect x="7" y="22" width="5" height="3" fill="#D6336C" />
  <rect x="36" y="22" width="5" height="3" fill="#D6336C" />
  
  <!-- Gờ bệ cửa sổ gỗ nổi bật -->
  <rect x="2" y="42" width="44" height="4" fill="#795653" />
  <rect x="4" y="42" width="40" height="2" fill="#DDB892" />
</svg>
`)}`;

// NỆM / GIƯỜNG MÈO LÔNG HỒNG PASTEL
export const PIXEL_CAT_BED_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36" style="shape-rendering: crispEdges;">
  <!-- Bóng chân giường -->
  <ellipse cx="24" cy="30" rx="20" ry="5" fill="#000000" opacity="0.25" />
  <!-- Viền nệm ngoài -->
  <ellipse cx="24" cy="20" rx="20" ry="11" fill="#795653" />
  <ellipse cx="24" cy="19" rx="19" ry="10" fill="#FF8FAB" />
  <!-- Lòng nệm nhung mềm mại -->
  <ellipse cx="24" cy="18" rx="15" ry="7.5" fill="#FFE5EC" />
  <ellipse cx="24" cy="17" rx="12" ry="5.5" fill="#FFFFFF" opacity="0.6" />
  <!-- Họa tiết dấu chân mèo -->
  <circle cx="24" cy="18" r="2.5" fill="#D6336C" opacity="0.5" />
  <circle cx="21" cy="14" r="1.2" fill="#D6336C" opacity="0.5" />
  <circle cx="24" cy="13" r="1.2" fill="#D6336C" opacity="0.5" />
  <circle cx="27" cy="14" r="1.2" fill="#D6336C" opacity="0.5" />
</svg>
`)}`;

// BÁT SỮA / BÁT CÁ ĂN CỦA MÈO
export const PIXEL_CAT_BOWL_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 28" width="36" height="28" style="shape-rendering: crispEdges;">
  <!-- Bóng chân bát -->
  <ellipse cx="18" cy="24" rx="14" ry="3.5" fill="#000000" opacity="0.25" />
  <!-- Viền sứ ngoài bát -->
  <ellipse cx="18" cy="17" rx="14" ry="7.5" fill="#795653" />
  <ellipse cx="18" cy="16" rx="13" ry="6.5" fill="#FFCCD5" />
  <!-- Lòng bát sứ trắng đựng sữa đầy -->
  <ellipse cx="18" cy="14.5" rx="10.5" ry="4.5" fill="#FFFFFF" />
  <ellipse cx="18" cy="14" rx="8.5" ry="3" fill="#FFF9F4" />
  <!-- Tai mèo trang trí 2 bên bát -->
  <polygon points="6,12 3,7 10,9" fill="#FF8FAB" stroke="#795653" stroke-width="1" />
  <polygon points="30,12 33,7 26,9" fill="#FF8FAB" stroke="#795653" stroke-width="1" />
</svg>
`)}`;

// CÂY CÀO MÓNG & THÁP MÈO GỖ 3 TẦNG
export const PIXEL_CAT_TREE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" width="48" height="64" style="shape-rendering: crispEdges;">
  <!-- Bóng đế -->
  <ellipse cx="24" cy="60" rx="18" ry="4" fill="#000000" opacity="0.25" />
  <!-- Đế gỗ -->
  <rect x="8" y="54" width="32" height="6" fill="#795653" />
  <rect x="9" y="53" width="30" height="3" fill="#DDB892" />
  <!-- Trụ quấn dây thừng -->
  <rect x="20" y="24" width="8" height="30" fill="#B07D62" />
  <line x1="20" y1="28" x2="28" y2="28" stroke="#E6CCB2" stroke-width="1" />
  <line x1="20" y1="34" x2="28" y2="34" stroke="#E6CCB2" stroke-width="1" />
  <line x1="20" y1="40" x2="28" y2="40" stroke="#E6CCB2" stroke-width="1" />
  <line x1="20" y1="46" x2="28" y2="46" stroke="#E6CCB2" stroke-width="1" />
  <line x1="20" y1="52" x2="28" y2="52" stroke="#E6CCB2" stroke-width="1" />
  <!-- Tầng trung gian lót nệm -->
  <rect x="12" y="32" width="24" height="4" fill="#795653" />
  <rect x="13" y="31" width="22" height="3" fill="#FFB3C6" />
  <!-- Nhà chòi trên đỉnh -->
  <rect x="10" y="8" width="28" height="18" fill="#795653" />
  <rect x="12" y="10" width="24" height="14" fill="#EDE0D4" />
  <!-- Cửa tròn vào chòi -->
  <circle cx="24" cy="18" r="5" fill="#795653" />
  <circle cx="24" cy="18" r="4" fill="#4A3E3D" />
  <!-- Nóc nhà chòi nệm hồng -->
  <rect x="8" y="5" width="32" height="4" fill="#795653" />
  <rect x="9" y="4" width="30" height="3" fill="#FF8FAB" />
</svg>
`)}`;

// BÀN TRÀ GỖ KEM SỮA VINTAGE
export const PIXEL_TABLE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36" style="shape-rendering: crispEdges;">
  <!-- Bóng bàn -->
  <ellipse cx="24" cy="32" rx="19" ry="4" fill="#000000" opacity="0.25" />
  <!-- Chân bàn 4 góc -->
  <rect x="8" y="16" width="4" height="15" fill="#795653" />
  <rect x="36" y="16" width="4" height="15" fill="#795653" />
  <rect x="12" y="14" width="4" height="13" fill="#A47551" opacity="0.7" />
  <rect x="32" y="14" width="4" height="13" fill="#A47551" opacity="0.7" />
  <!-- Mặt bàn gỗ sồi -->
  <rect x="4" y="10" width="40" height="7" fill="#795653" />
  <rect x="5" y="8" width="38" height="5" fill="#D4A373" />
  <rect x="6" y="8" width="36" height="3" fill="#FAEDCD" />
  <!-- Tách trà mèo mini trên bàn -->
  <rect x="22" y="4" width="6" height="5" fill="#FFFFFF" stroke="#795653" stroke-width="1" />
  <rect x="23" y="5" width="4" height="2" fill="#8AC926" />
</svg>
`)}`;

// CUỘN LEN CHƠI ĐÙA CỦA MÈO
export const PIXEL_YARN_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28" width="32" height="28" style="shape-rendering: crispEdges;">
  <!-- Bóng -->
  <ellipse cx="16" cy="24" rx="10" ry="3" fill="#000000" opacity="0.25" />
  <!-- Cuộn len tròn -->
  <circle cx="16" cy="14" r="10" fill="#795653" />
  <circle cx="16" cy="14" r="9" fill="#A9C5F2" />
  <path d="M10 11 Q16 8 22 11" stroke="#4682B4" stroke-width="1.5" fill="none" />
  <path d="M9 16 Q16 20 23 16" stroke="#4682B4" stroke-width="1.5" fill="none" />
  <!-- Sợi len vương vãi trên sàn -->
  <path d="M22 18 Q26 23 29 24" stroke="#4682B4" stroke-width="2" fill="none" />
</svg>
`)}`;

// SOFA CÁ HỒNG PASTEL
export const PIXEL_SOFA_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 36" width="54" height="36" style="shape-rendering: crispEdges;">
  <!-- Bóng sofa -->
  <ellipse cx="27" cy="32" rx="22" ry="4" fill="#000000" opacity="0.25" />
  <!-- Thân sofa hình cá -->
  <rect x="6" y="10" width="38" height="18" rx="4" fill="#795653" />
  <rect x="7" y="10" width="36" height="16" rx="3" fill="#FF8FAB" />
  <rect x="8" y="18" width="34" height="9" fill="#FFCCD5" />
  <!-- Đuôi cá chìa ra -->
  <polygon points="44,14 52,8 52,24" fill="#FF8FAB" stroke="#795653" stroke-width="1" />
  <!-- Mắt cá -->
  <circle cx="13" cy="15" r="2.5" fill="#FFFFFF" />
  <circle cx="13" cy="15" r="1.5" fill="#795653" />
</svg>
`)}`;

// CHẬU CỎ CATNIP MÁT LÀNH
export const PIXEL_PLANT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36" style="shape-rendering: crispEdges;">
  <ellipse cx="18" cy="32" rx="11" ry="3" fill="#000000" opacity="0.25" />
  <!-- Chậu đất nung -->
  <polygon points="10,22 26,22 23,32 13,32" fill="#B07D62" stroke="#795653" stroke-width="1" />
  <rect x="9" y="20" width="18" height="3" fill="#DDB892" stroke="#795653" stroke-width="1" />
  <!-- Cành lá catnip -->
  <path d="M18 20 Q14 12 10 13" stroke="#2D6A4F" stroke-width="2.5" fill="none" />
  <path d="M18 20 Q18 8 18 6" stroke="#52B788" stroke-width="3" fill="none" />
  <path d="M18 20 Q22 12 26 13" stroke="#2D6A4F" stroke-width="2.5" fill="none" />
  <circle cx="10" cy="13" r="2" fill="#74C69D" />
  <circle cx="18" cy="6" r="2.5" fill="#95D5B2" />
  <circle cx="26" cy="13" r="2" fill="#74C69D" />
</svg>
`)}`;

// ĐÈN NGỦ BÀN DẤU CHÂN MÈO VÀNG ẤM
export const PIXEL_LAMP_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40" style="shape-rendering: crispEdges;">
  <ellipse cx="16" cy="36" rx="9" ry="3" fill="#000000" opacity="0.25" />
  <!-- Đế đèn -->
  <rect x="11" y="32" width="10" height="4" fill="#795653" />
  <!-- Thân kim loại -->
  <rect x="15" y="20" width="2" height="13" fill="#D4A373" />
  <!-- Chụp đèn phát sáng vàng -->
  <polygon points="8,20 24,20 20,8 12,8" fill="#FEE440" stroke="#795653" stroke-width="1" />
  <!-- Dấu chân trên chụp đèn -->
  <circle cx="16" cy="14" r="1.5" fill="#E76F51" />
  <circle cx="14" cy="12" r="0.8" fill="#E76F51" />
  <circle cx="18" cy="12" r="0.8" fill="#E76F51" />
</svg>
`)}`;

// THẢM LÔNG HÌNH DẤU CHÂN MÈO
export const PIXEL_RUG_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36" style="shape-rendering: crispEdges;">
  <ellipse cx="24" cy="20" rx="20" ry="12" fill="#000000" opacity="0.12" />
  <ellipse cx="24" cy="18" rx="20" ry="12" fill="#795653" />
  <ellipse cx="24" cy="17" rx="19" ry="11" fill="#FFCCD5" />
  <!-- Đệm chân chính giữa -->
  <ellipse cx="24" cy="20" rx="7" ry="5" fill="#D6336C" opacity="0.75" />
  <!-- 4 ngón chân -->
  <circle cx="16" cy="13" r="2.5" fill="#D6336C" opacity="0.75" />
  <circle cx="21" cy="11" r="2.8" fill="#D6336C" opacity="0.75" />
  <circle cx="27" cy="11" r="2.8" fill="#D6336C" opacity="0.75" />
  <circle cx="32" cy="13" r="2.5" fill="#D6336C" opacity="0.75" />
</svg>
`)}`;

// Helper lấy hình ảnh Pixel tương ứng với từng Item ID
export function getFurniturePixelImage(itemId: string): string {
  if (itemId.startsWith('bed_')) return `/assets/furniture/beds/${itemId}.png`;
  if (itemId.startsWith('sofa_')) return `/assets/furniture/sofas/${itemId}.png`;
  if (itemId.startsWith('wall_')) return `/assets/furniture/wallpapers/${itemId}.png`;
  if (itemId.startsWith('floor_')) return `/assets/furniture/floors/${itemId}.png`;
  if (itemId.startsWith('decor_')) return `/assets/furniture/decor/${itemId}.png`;
  return '';
}
