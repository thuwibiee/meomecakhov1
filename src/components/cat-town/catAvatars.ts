export interface CatAvatarOption {
  id: string;
  name: string;
  defaultName: string;
  breed: string;
  avatarUrl: string;
  collar: string;
  description: string;
  color: string;
}

export const CAT_AVATARS: CatAvatarOption[] = [
  {
    id: 'cat_01',
    name: 'Mèo Xiêm Mắt Xanh',
    defaultName: 'Bánh Bao Mắt Biếc',
    breed: 'Mèo Xiêm',
    avatarUrl: '/assets/cats/cat_01.png',
    collar: 'Ngôi sao vàng hoàng gia',
    description: 'Đôi mắt xanh sapphire lấp lánh, tính cách điềm tĩnh và câu cá siêu cừ khôi.',
    color: '#D4A373',
  },
  {
    id: 'cat_02',
    name: 'Mèo Cam Chuông Vàng',
    defaultName: 'Bánh Mì Bo',
    breed: 'Mèo Cam',
    avatarUrl: '/assets/cats/cat_02.png',
    collar: 'Chuông vàng leng keng',
    description: 'Chàng mèo cam tinh nghịch, mắt híp cười toe toét, mê cá khô số một vũ trụ!',
    color: '#F4A261',
  },
  {
    id: 'cat_03',
    name: 'Mèo Trắng Nơ Hồng',
    defaultName: 'Bông Gòn Tiểu Thư',
    breed: 'Mèo Trắng',
    avatarUrl: '/assets/cats/cat_03.png',
    collar: 'Nơ hồng & Mặt tim ngọt ngào',
    description: 'Bộ lông trắng muốt như mây bồng bềnh, điệu đà và luôn mang lại may mắn.',
    color: '#FFFFFF',
  },
  {
    id: 'cat_04',
    name: 'Mèo Tuxedo Bicolor',
    defaultName: 'Đại Ca Cá Xanh',
    breed: 'Mèo Tuxedo',
    avatarUrl: '/assets/cats/cat_04.png',
    collar: 'Mặt cá ngừ xanh pastel',
    description: 'Diện bộ vest lông bảnh bao, ánh nhìn kiên định, chuyên gia canh than nướng cá.',
    color: '#3D3A45',
  },
  {
    id: 'cat_05',
    name: 'Mèo Tam Thể Hoa Cúc',
    defaultName: 'Bé Hoa Cúc',
    breed: 'Mèo Tam Thể',
    avatarUrl: '/assets/cats/cat_05.png',
    collar: 'Bông hoa cúc trắng tinh khôi',
    description: 'Ba màu lông may mắn tài lộc, tính tình thân thiện, vuốt ve là rừ rừ sảng khoái.',
    color: '#E76F51',
  },
  {
    id: 'cat_06',
    name: 'Mèo Ba Tư Lông Xù',
    defaultName: 'Kẹo Bông Nơ Tím',
    breed: 'Mèo Ba Tư',
    avatarUrl: '/assets/cats/cat_06.png',
    collar: 'Nơ tím thắt chuông quý tộc',
    description: 'Bộ lông xù mềm như nhung, lim dim mắt mơ màng, thích nằm nệm êm sưởi nắng.',
    color: '#F8F9FA',
  },
  {
    id: 'cat_07',
    name: 'Mèo Đen Trăng Khuyết',
    defaultName: 'Hạt Tiêu Huyền Bí',
    breed: 'Mèo Đen',
    avatarUrl: '/assets/cats/cat_07.png',
    collar: 'Trăng khuyết hoàng đạo vàng',
    description: 'Linh miêu bóng đêm huyền bí, mắt hổ phách tinh anh, tiên tri bói cá linh nghiệm.',
    color: '#2B2830',
  },
  {
    id: 'cat_08',
    name: 'Mèo Mướp Cỏ 4 Lá',
    defaultName: 'Mướp Mập May Mắn',
    breed: 'Mèo Mướp',
    avatarUrl: '/assets/cats/cat_08.png',
    collar: 'Cỏ 4 lá xanh mướt mát lành',
    description: 'Vằn xám cổ điển đáng yêu, tràn đầy năng lượng tích cực và luôn sẵn sàng phiêu lưu!',
    color: '#A89F91',
  },
];

export function getCatAvatarById(id?: string): CatAvatarOption {
  if (!id) return CAT_AVATARS[1]; // Default to Orange Tabby
  const found = CAT_AVATARS.find((c) => c.id === id);
  return found || CAT_AVATARS[1];
}
