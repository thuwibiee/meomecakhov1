import fs from 'fs';

const bedNames = [
  { name: 'Giường Nệm Rơm Vàng', price: 20, desc: 'Nệm đan rơm vàng mộc mạc lót bông mềm mại cho mèo con say giấc.' },
  { name: 'Giường Gỗ Khăn Ca-rô', price: 25, desc: 'Khung gỗ sồi tự nhiên lót chăn kẻ ca-rô xanh ấm áp ngày đông.' },
  { name: 'Nệm Lông Cừu Dâu Tây', price: 30, desc: 'Nệm tròn mềm xốp thêu hình quả dâu tây ngọt ngào.' },
  { name: 'Giường Công Chúa Pastel', price: 35, desc: 'Giường ngủ viền bèo nhún màu hồng phấn ngọt ngào cho bé mèo.' },
  { name: 'Nệm Vỏ Sò Biển Xanh', price: 40, desc: 'Tạo hình vỏ sò đại dương xanh ngọc, nệm êm ái mát rượi.' },
  { name: 'Giường Hộp Carton Vintage', price: 45, desc: 'Chiếc hộp carton mà mèo mê mẩn, lót thêm nệm nhung xịn.' },
  { name: 'Nệm Tai Thỏ Xốp Mềm', price: 50, desc: 'Nệm nhung tuyết có đôi tai thỏ vểnh đáng yêu, giữ ấm tuyệt đối.' },
  { name: 'Giường Bánh Mì Nướng Bơ', price: 55, desc: 'Thiết kế lát bánh mì nướng vàng giòn, mèo nằm vào cưng xỉu.' },
  { name: 'Giường Gỗ Tầng Rừng Xanh', price: 60, desc: 'Khung gỗ phong cách mộc mạc, nệm xanh lá rừng thiên nhiên.' },
  { name: 'Nệm Lười Quả Bơ Béo', price: 65, desc: 'Hình nửa quả bơ xanh ngọc béo tròn, ruột nệm êm như mây.' },
  { name: 'Giường Cổ Điển Hoàng Gia', price: 70, desc: 'Giường gỗ chạm khắc hoa văn hoàng tộc, phủ chăn gấm tím quý phái.' },
  { name: 'Nệm Bát Mì Ramen Nóng', price: 75, desc: 'Chiếc nệm hình tô ramen thơm phức, có cả nắp đậy giữ ấm.' },
  { name: 'Giường Lều Du Mục Boho', price: 80, desc: 'Lều vải Canvas phong cách thổ dân, chỗ ẩn nấp lý tưởng của hoàng thượng.' },
  { name: 'Nệm Hoa Hướng Dương', price: 85, desc: 'Cánh hoa vàng rực rỡ ôm trọn chú mèo cưng, tràn đầy năng lượng.' },
  { name: 'Giường Phi Thuyền Vũ Trụ', price: 90, desc: 'Thiết kế phi thuyền hiện đại, kính vòm trong suốt cực ngầu.' },
  { name: 'Ngai Vàng Mèo Đế Vương', price: 95, desc: 'Ngai vàng dát ngọc hoàng gia nạm hồng bảo, đẳng cấp thượng đế mèo!' },
];

const sofaNames = [
  { name: 'Sofa Băng Dài Kem Sữa', price: 35, desc: 'Ghế bành dài êm ái bọc nỉ màu kem, đủ chỗ cho đàn mèo phơi bụng.' },
  { name: 'Sofa Nhung Đỏ Rượu Vang', price: 45, desc: 'Chất liệu nhung đỏ sang trọng, tôn lên nét quý phái cho phòng khách.' },
  { name: 'Sofa Xanh Rêu Vintage', price: 55, desc: 'Tông xanh cổ điển thanh lịch, đệm bông dày dặn đàn hồi êm ru.' },
  { name: 'Sofa Da Bò Nâu Ấm Áp', price: 65, desc: 'Ghế da phong cách quý tộc cổ điển, chống trầy móng vuốt mèo hiệu quả.' },
  { name: 'Sofa Hồng Kẹo Ngọt MMCK', price: 75, desc: 'Sofa hồng pastel phong cách tiệm bánh ngọt ngào thêu hoa văn độc quyền.' },
  { name: 'Sofa Hoàng Tộc Thượng Hạng', price: 90, desc: 'Tay vịn uốn lượn phong cách Baroque, nệm gấm cao cấp cho vua mèo.' },
];

const wallNames = [
  { name: 'Tường Sọc Kem Vani', price: 30, desc: 'Họa tiết sọc dọc pastel kem nhẹ nhàng, tạo cảm giác trần nhà cao ráo.' },
  { name: 'Tường Hồng Phấn Ngọt Ngào', price: 35, desc: 'Tông hồng pastel dịu mắt, mang hơi thở ấm áp như phòng công chúa.' },
  { name: 'Tường Xanh Bạc Hà Mát Lành', price: 40, desc: 'Sắc xanh mint thanh mát, xoa dịu đôi mắt và đem lại giấc ngủ ngon.' },
  { name: 'Tường Bầu Trời Mây Trắng', price: 45, desc: 'Bầu trời xanh ngắt điểm xuyết những đám mây trắng xốp bay bổng.' },
  { name: 'Tường Gạch Mộc Cổ Kính', price: 50, desc: 'Gạch nung đỏ ấm cúng phong cách nhà gỗ vùng quê châu Âu.' },
  { name: 'Tường Dấu Chân Mèo', price: 55, desc: 'Hàng ngàn dấu chân mèo ngộ nghĩnh in nổi trên nền giấy dán tường.' },
  { name: 'Tường Hoa Nhí Đồng Quê', price: 60, desc: 'Những đóa hoa cúc họa mi nhỏ nhắn tinh tế phong cách Cottagecore.' },
  { name: 'Tường Vàng Nắng Ban Mai', price: 65, desc: 'Ánh nắng bình minh rọi sáng căn phòng, tràn đầy năng lượng tươi mới.' },
  { name: 'Tường Tím Hoa Oải Hương', price: 70, desc: 'Sắc tím Lavender mộng mơ giúp an thần và thư giãn tinh thần tối đa.' },
  { name: 'Tường Rừng Rậm Nhiệt Đới', price: 75, desc: 'Tán lá dừa và cây cọ xanh mướt cho mèo cảm giác làm chúa tể sơn lâm.' },
  { name: 'Tường Bầu Trời Đêm Đầy Sao', price: 80, desc: 'Ngàn vì sao lấp lánh giữa màn đêm huyền bí, có dải ngân hà huyền ảo.' },
  { name: 'Tường Kẹo Bông Cầu Vồng', price: 85, desc: 'Dải màu cầu vồng chuyển sắc mượt mà ngọt ngào như tiệm kẹo marshmallow.' },
  { name: 'Tường Đá Cẩm Thạch Xa Hoa', price: 90, desc: 'Vân đá cẩm thạch trắng viền vàng kim quý tộc, tôn vinh vẻ vương giả.' },
  { name: 'Tường Tranh Cá Biển Thủy Cung', price: 95, desc: 'Những đàn cá bơi lội tung tăng quanh rạn san hô, mèo ngắm mê mẩn.' },
  { name: 'Tường Cung Điện Ánh Trăng', price: 105, desc: 'Tường dát vàng ánh trăng lung linh độc bản chỉ có tại thị trấn mèo.' },
];

const floorNames = [
  { name: 'Sàn Ván Gỗ Sồi Sáng', price: 25, desc: 'Ván gỗ tự nhiên màu sáng mộc mạc, tạo cảm giác sạch sẽ và ấm chân.' },
  { name: 'Sàn Gỗ Xương Cá Cổ Điển', price: 30, desc: 'Kiểu ghép xương cá tinh tế chuẩn phong cách kiến trúc Pháp sang trọng.' },
  { name: 'Sàn Gạch Bông Hoài Niệm', price: 35, desc: 'Hoa văn gạch bông vintage mát rượi những ngày hè nóng bức.' },
  { name: 'Sàn Đá Trắng Cẩm Thạch', price: 40, desc: 'Bề mặt đá bóng bẩy mát rượi, mèo rất thích nằm ườn giải nhiệt.' },
  { name: 'Sàn Gỗ Nâu Trầm Ấm Áp', price: 45, desc: 'Gỗ óc chó màu nâu trầm ấm cúng, đem lại cảm giác bình yên thư thái.' },
  { name: 'Sàn Chiếu Tatami Truyền Thống', price: 50, desc: 'Chiếu rơm thơm hương thảo mộc tự nhiên, thân thiện với đệm thịt của mèo.' },
  { name: 'Sàn Thảm Cỏ Xanh Rì Rào', price: 55, desc: 'Mô phỏng bãi cỏ tự nhiên mềm mại, như đang dạo chơi giữa công viên.' },
  { name: 'Sàn Gạch Ca-rô Đen Trắng', price: 60, desc: 'Bàn cờ ca-rô cá tính hiện đại, biến phòng khách thành sàn diễn thời trang.' },
  { name: 'Sàn Gỗ Hoa Hồng Pastel', price: 65, desc: 'Ván sàn phủ men hồng ánh kim nữ tính, tạo không gian thơ mộng.' },
  { name: 'Sàn Đá Sỏi Suối Trong Lành', price: 70, desc: 'Những viên sỏi cuội nhẵn bóng mát mẻ giúp massage bàn chân mèo.' },
  { name: 'Sàn Gạch Men Lam Thượng Hạng', price: 75, desc: 'Họa tiết men lam cung đình tinh xảo được thợ gốm lành nghề chế tác.' },
  { name: 'Sàn Kẹo Bánh Quy Ngọt Ngào', price: 80, desc: 'Các ô bánh quy bơ nướng thơm phức lót sàn, biến ngôi nhà thành xứ kẹo.' },
  { name: 'Sàn Dung Nham Lửa Ấm Áp', price: 85, desc: 'Họa tiết đá núi lửa phát nhiệt dịu nhẹ sưởi ấm mùa đông băng giá.' },
  { name: 'Sàn Thủy Tinh Ngắm Cá', price: 90, desc: 'Sàn kính nhìn thẳng xuống đáy hồ bong bóng, đàn cá bơi dưới chân.' },
  { name: 'Sàn Vàng Hoàng Kim Lộng Lẫy', price: 95, desc: 'Dát vàng 24K rực rỡ lấp lánh khắp mặt sàn dinh thự của hoàng thượng mèo.' },
];

const decorNames = [
  'Tủ Quần Áo Gỗ Sồi 2 Cánh',
  'Tủ Sách Gỗ Thông Nhiều Ngăn',
  'Kệ Bếp Men Xanh Pastel',
  'Tủ Trưng Bày Màu Rêu',
  'Kệ Gỗ Tím Oải Hương',
  'Tủ Đựng Đồ Gỗ Mộc',
  'Cửa Sổ Vòm Đón Nắng Sớm',
  'Gương Soi Đứng Viền Đen',
  'Cửa Sổ Gỗ Hai Cánh Vintage',
  'Gương Soi Viền Hồng Pastel',
  'Bàn Trà Tròn Chân Gỗ Hồng',
  'Bàn Trà Gỗ Sồi Sáng',
  'Bàn Trà Xanh Bạc Hà',
  'Bàn Ăn Dài Gia Đình Mèo',
  'Chậu Cây Kiểng Lá Xanh',
  'Đèn Cây Phòng Khách Cổ Điển',
  'Cây Cào Móng Mèo Cao Tầng',
  'Đệm Ngồi Bệt Tròn Màu Be',
  'Đệm Bệt Lông Cừu Mềm Xốp',
  'Đệm Bệt Xám Tro Êm Ái',
  'Đệm Ngồi Bơ Vàng Xinh Xắn',
  'Giỏ Mây Mèo Nằm Cuộn Tròn',
  'Lò Sưởi Gạch Củi Hồng Ấm Áp',
  'Lò Sưởi Cổ Điển Viền Hồng',
  'Lò Sưởi Đá Tím Quý Tộc',
  'Lò Sưởi Đá Rêu Cổ Kính',
  'Lò Sưởi Men Lam Băng Tuyết',
  'Đàn Piano Cổ Điển',
  'Tivi Hoài Niệm Màn Hình Cong',
  'Đài Radio Cassette Retro',
  'Đồng Hồ Để Bàn Cổ Điển',
  'Bồn Tắm Chân Quỳ Bọt Tuyết',
  'Tủ Kính Lưu Niệm Hoàng Gia',
  'Bàn Phấn Trang Điểm Mini',
  'Ghế Đẩu Bọc Đệm Nhung',
  'Kệ Đầu Giường Gỗ Trầm',
  'Bàn Cà Phê Chân Thấp',
  'Ghế Xoay Quầy Bar Đỏ Rượu',
  'Tủ Tivi Gỗ Hiện Đại',
  'Ghế Bành Thư Giãn Bọc Nỉ',
  'Bàn Học Trẻ Em Pastel',
  'Ghế Đôn Vuông Xinh Xắn',
  'Đèn Cây Đứng Vòm Cong',
  'Tủ Rượu Cổ Kính',
  'Tủ Đựng Đồ Chơi Gỗ Trắng',
  'Kệ Cây Cảnh Trong Nhà',
  'Giá Treo Đồ & Mũ Áo',
  'Bàn Trà Gỗ Óc Chó',
  'Kệ Tường Dài Treo Tranh',
  'Gương Toàn Thân Kiểu Cung Điện',
  'Chậu Cây Kim Ngân Chiêu Tài',
  'Ghế Tựa Hồng Công Chúa',
  'Tủ Bếp Mini Nhiều Ngăn',
  'Máy Giặt Mini Tiện Ích',
  'Thùng Rác Dễ Thương Hình Mèo',
  'Ghế Đọc Sách Thư Thái',
  'Tủ Giày Gỗ Sồi',
  'Đèn Chùm Tinh Thể Lấp Lánh',
  'Cây Treo Chậu Hoa Leo',
  'Bàn Ăn Nhỏ 2 Chỗ',
  'Ghế Sofa Đơn Nệm Êm',
  'Bàn Trà Mặt Kính Tròn',
  'Thảm Lông Tròn Xinh Xắn',
  'Tháp Leo Trèo Khám Phá',
  'Bình Gốm Cắm Cành Đào',
  'Hộp Nhạc Gỗ Du Dương',
  'Giỏ Đựng Đồ Chơi Len',
  'Tủ Chén Bát Sứ Hoa Lam',
  'Đèn Ngủ Để Bàn Nấm Lùn',
  'Bình Tưới Cây Men Sứ',
  'Lọ Hoa Thủy Tinh Để Bàn',
  'Tủ Đầu Giường 3 Tầng',
  'Bàn Vi Tính Hiện Đại',
  'Bàn Trà Nhật Ngồi Bệt',
  'Bát Ăn Cho Mèo Đôi Sứ Trắng',
  'Đệm Bát Mì Ramen Độc Đáo',
  'Chuông Gió Treo Ban Công',
  'Khay Cát Mèo Tự Động',
  'Máy Lọc Không Khí Mini',
  'Bình Nước Tự Động Cho Mèo',
  'Thảm Cào Móng Hình Con Cá',
  'Tủ Đựng Đồ Đa Năng',
  'Bàn Làm Việc Vintage',
  'Ghế Bập Bênh Thư Giãn',
  'Tủ Sách Góc Tường',
  'Kệ Trang Trí Treo Tường',
  'Ghế Lười Hạt Xốp Khổng Lồ',
  'Bồn Rửa Mặt Mini Sứ Men',
  'Tủ Quần Áo Cửa Lùa',
  'Bàn Trang Điểm Gương Tròn',
  'Tủ Búp Bê Kính Trong Suốt',
  'Ghế Sofa Góc Phòng Khách',
  'Bàn Ăn Bằng Đá Cẩm Thạch',
  'Cây Thông Noel Lấp Lánh',
  'Tủ Buffet Phòng Khách',
  'Kệ Trưng Bày Đồ Lưu Niệm',
  'Nôi Mèo Treo Trần Dây Thừng',
  'Bể Cá Cảnh Mini Thủy Sinh',
  'Đài Phun Nước Phong Thủy',
  'Máy Chơi Game Thùng Retro',
  'Bàn Bi-a Mini Thư Giãn',
  'Đồng Hồ Cây Quả Lắc Cung Đình',
  'Hộp Kho Báu Mèo Hoàng Gia',
  'Bộ Sofa Da Phòng Khách Sang Trọng'
];

let code = `import { CatTownFurniture, FurnitureCategory } from '../../types.ts';

// Danh mục toàn bộ nội thất chuẩn Pixel RPG chia thành 5 danh mục:
// 1. GIƯỜNG NGỦ (16 mẫu từ beds_1 & beds_2)
// 2. SOFA (6 mẫu sofa từ decor_1)
// 3. TƯỜNG (15 mẫu giấy dán tường từ wallpapers)
// 4. SÀN (15 mẫu ván lát sàn từ floors)
// 5. TRANG TRÍ (104 mẫu đồ dùng, bàn ghế, cây cảnh, tủ kệ, đồ chơi mèo từ decor_1, decor_2 & decor_new)

export const DEFAULT_FURNITURE_CATALOG: CatTownFurniture[] = [
  // ================= 1. GIƯỜNG NGỦ (16 MẪU) =================
`;

bedNames.forEach((b, i) => {
  const id = `bed_${String(i + 1).padStart(2, '0')}`;
  code += `  {
    id: '${id}',
    name: '${b.name}',
    category: 'bed',
    price: ${b.price},
    description: '${b.desc}',
    imageUrl: '/assets/furniture/beds/${id}.png',
    dimensions: { w: 1, h: 1 },
  },\n`;
});

code += `\n  // ================= 2. SOFA (6 MẪU) =================\n`;
sofaNames.forEach((s, i) => {
  const id = `sofa_${String(i + 1).padStart(2, '0')}`;
  code += `  {
    id: '${id}',
    name: '${s.name}',
    category: 'sofa',
    price: ${s.price},
    description: '${s.desc}',
    imageUrl: '/assets/furniture/sofas/${id}.png',
    dimensions: { w: 2, h: 1 },
  },\n`;
});

code += `\n  // ================= 3. GIẤY DÁN TƯỜNG (15 MẪU) =================\n`;
wallNames.forEach((w, i) => {
  const id = `wall_${String(i + 1).padStart(2, '0')}`;
  code += `  {
    id: '${id}',
    name: '${w.name}',
    category: 'wallpaper',
    price: ${w.price},
    description: '${w.desc}',
    imageUrl: '/assets/furniture/wallpapers/${id}.png',
    dimensions: { w: 1, h: 1 },
  },\n`;
});

code += `\n  // ================= 4. SÀN NHÀ (15 MẪU) =================\n`;
floorNames.forEach((fl, i) => {
  const id = `floor_${String(i + 1).padStart(2, '0')}`;
  code += `  {
    id: '${id}',
    name: '${fl.name}',
    category: 'floor',
    price: ${fl.price},
    description: '${fl.desc}',
    imageUrl: '/assets/furniture/floors/${id}.png',
    dimensions: { w: 1, h: 1 },
  },\n`;
});

code += `\n  // ================= 5. TRANG TRÍ (104 MẪU ĐẦY ĐỦ) =================\n`;
decorNames.forEach((name, i) => {
  const id = `decor_${String(i + 1).padStart(2, '0')}`;
  const price = 15 + Math.floor((i * 105) / decorNames.length);
  code += `  {
    id: '${id}',
    name: '${name}',
    category: 'decor',
    price: ${price},
    description: 'Món đồ trang trí pixel phong cách RPG dễ thương dành cho dinh thự mèo.',
    imageUrl: '/assets/furniture/decor/${id}.png',
    dimensions: { w: 1, h: 1 },
  },\n`;
});

code += `];

// Helper lấy URL ảnh của món đồ nội thất (ưu tiên asset thật đã cắt, fallback sang pixel SVG)
export function getFurnitureAssetUrl(itemId: string, fallbackUrl?: string): string {
  if (fallbackUrl && fallbackUrl.startsWith('/assets/')) return fallbackUrl;

  const found = DEFAULT_FURNITURE_CATALOG.find((f) => f.id === itemId);
  if (found?.imageUrl) return found.imageUrl;

  // Pattern matching by ID prefix
  if (itemId.startsWith('bed_')) return \`/assets/furniture/beds/\${itemId}.png\`;
  if (itemId.startsWith('sofa_')) return \`/assets/furniture/sofas/\${itemId}.png\`;
  if (itemId.startsWith('wall_')) return \`/assets/furniture/wallpapers/\${itemId}.png\`;
  if (itemId.startsWith('floor_')) return \`/assets/furniture/floors/\${itemId}.png\`;
  if (itemId.startsWith('decor_')) return \`/assets/furniture/decor/\${itemId}.png\`;

  return fallbackUrl || '/assets/furniture/beds/bed_01.png';
}

// Lấy danh sách item theo category và tự động sắp xếp theo giá tăng dần
export function getCatalogByCategory(
  catalog: CatTownFurniture[],
  category: 'bed' | 'sofa' | 'wallpaper' | 'floor' | 'decor'
): CatTownFurniture[] {
  return catalog
    .filter((item) => {
      if (item.isHidden) return false;
      if (category === 'bed') return item.category === 'bed';
      if (category === 'sofa') return item.category === 'sofa';
      if (category === 'wallpaper') return item.category === 'wallpaper';
      if (category === 'floor') return item.category === 'floor';
      if (category === 'decor') {
        return (
          item.category === 'decor' ||
          item.category === 'furniture' ||
          item.category === 'cat_item' ||
          item.category === 'plant' ||
          item.category === 'toy'
        );
      }
      return false;
    })
    .sort((a, b) => a.price - b.price);
}
`;

fs.writeFileSync('src/components/cat-town/furnitureCatalog.ts', code);
console.log('Successfully written src/components/cat-town/furnitureCatalog.ts!');
