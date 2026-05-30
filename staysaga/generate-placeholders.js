const fs = require('fs');
const path = require('path');

const routes = [
  { p: 'availability', title: 'Mở/đóng phòng', desc: 'Quản lý tình trạng mở hoặc đóng phòng cho các ngày cụ thể.' },
  { p: 'rates/copy', title: 'Sao chép giá', desc: 'Sao chép giá cho các ngày trong tương lai một cách nhanh chóng.' },
  { p: 'restrictions', title: 'Quy tắc giới hạn linh động', desc: 'Thiết lập các quy tắc giới hạn linh động cho phòng của bạn.' },
  { p: 'calendar-sync', title: 'Đồng bộ hóa lịch', desc: 'Đồng bộ lịch với các nền tảng khác để tránh overbooking.' },
  { p: 'open-availability', title: 'Tính năng mở phòng trống', desc: 'Khám phá các tính năng giúp mở phòng trống hiệu quả hơn.' },
  { p: 'rate-plans', title: 'Loại giá', desc: 'Cấu hình và quản lý các loại giá khác nhau cho chỗ nghỉ.' },
  { p: 'value-added-services', title: 'Dịch vụ giá trị gia tăng', desc: 'Thêm các dịch vụ bổ sung để tăng doanh thu cho chỗ nghỉ.' },
  { p: 'guest-pricing', title: 'Giá theo số lượng khách', desc: 'Thiết lập giá thay đổi tùy theo số lượng khách lưu trú.' },
  { p: 'country-rates', title: 'Mức giá theo quốc gia', desc: 'Cài đặt mức giá đặc biệt cho khách từ các quốc gia cụ thể.' },
  { p: 'mobile-rates', title: 'Giá trên điện thoại', desc: 'Ưu đãi đặc biệt dành cho khách hàng đặt phòng qua thiết bị di động.' }
];

const basePath = path.join(process.cwd(), 'src/app/(host)/host');

routes.forEach(route => {
  const dirPath = path.join(basePath, route.p);
  fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    const content = `import { PlaceholderPage } from "@/components/host/PlaceholderPage";

export default function Page() {
  return (
    <PlaceholderPage 
      title="${route.title}"
      description="${route.desc}"
    />
  );
}
`;
    fs.writeFileSync(filePath, content);
    console.log('Created: ' + filePath);
  } else {
    console.log('Exists: ' + filePath);
  }
});
