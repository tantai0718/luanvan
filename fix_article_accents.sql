-- Cập nhật toàn bộ bài viết mẫu sang tiếng Việt có dấu.
UPDATE bai_viet SET
  tieu_de = '7 Mẹo Bảo Quản Rau Lá Xanh Tươi Lâu Hơn Trong Tủ Lạnh',
  mo_ta_ngan = 'Rau lá xanh rất dễ bị héo chỉ sau 1–2 ngày nếu bảo quản sai cách. Áp dụng 7 mẹo đơn giản này để giữ rau tươi lâu gấp đôi.',
  noi_dung = '<h2>Tại sao rau lá xanh nhanh héo?</h2><p>Rau lá xanh chứa tới 90% là nước. Khi bị mất nước hoặc tiếp xúc với khí ethylene từ trái cây chín, rau sẽ héo và vàng rất nhanh.</p><h2>Mẹo 1: Không rửa rau trước khi cất</h2><p>Độ ẩm thừa tạo điều kiện cho vi khuẩn phát triển. Chỉ rửa rau ngay trước khi dùng.</p><h2>Mẹo 2: Bọc rau trong khăn giấy ẩm</h2><p>Dùng khăn giấy làm ẩm nhẹ, gói quanh bó rau rồi cho vào túi zip. Thay khăn mới mỗi hai ngày.</p><h2>Mẹo 3: Cắm rau vào ly nước</h2><p>Với rau muống, cải xanh và húng quế, hãy cắt vát gốc rồi cắm vào ly nước. Để nơi thoáng mát để rau tươi lâu hơn.</p><h2>Thời gian bảo quản tham khảo</h2><ul><li>Xà lách: 5–7 ngày trong hộp kín</li><li>Rau muống: 3–5 ngày bọc khăn giấy</li><li>Rau đã cấp đông: 2–3 tháng</li></ul>'
WHERE mabv = 6;

UPDATE bai_viet SET
  tieu_de = 'Bảo Quản Cà Chua Đúng Cách - Đừng Để Trong Tủ Lạnh!',
  mo_ta_ngan = 'Nhiều người có thói quen cho cà chua vào tủ lạnh nhưng đây lại là cách làm mất đi hương vị tự nhiên.',
  noi_dung = '<h2>Tại sao không nên để cà chua trong tủ lạnh?</h2><p>Nhiệt độ lạnh dưới 12 độ C làm ngừng hoạt động enzyme tạo hương vị. Khi lấy ra, cà chua dễ mất vị ngọt, trở nên bột và nhạt.</p><h2>Bảo quản cà chua chưa chín</h2><p>Để ở nhiệt độ phòng, tránh ánh nắng. Đặt cuống hướng xuống dưới để hạn chế không khí xâm nhập. Cà chua sẽ chín sau 3–7 ngày.</p><h2>Bảo quản cà chua đã chín</h2><p>Để được 2–3 ngày ở nhiệt độ phòng. Nếu đã cắt, hãy bọc màng thực phẩm và dùng trong hai ngày.</p><h2>Mẹo từ nông dân</h2><p>Đặt một đến hai quả táo chín cạnh cà chua xanh; khí ethylene từ táo giúp cà chua chín nhanh hơn.</p>'
WHERE mabv = 7;

UPDATE bai_viet SET
  tieu_de = 'Khoai Tây, Hành Củ, Tỏi - Bộ Ba Gia Vị Cần Biết Cách Bảo Quản',
  mo_ta_ngan = 'Khoai tây, hành và tỏi là ba thực phẩm hầu như nhà nào cũng có nhưng thường bị hỏng do bảo quản sai cách.',
  noi_dung = '<h2>Khoai tây - tránh ánh sáng và độ ẩm</h2><p>Khoai gặp ánh sáng sẽ sản sinh solanine, khiến khoai có vị đắng và xuất hiện màu xanh trên vỏ.</p><ul><li>Để nơi tối, khô ráo, thoáng mát</li><li>Không để trong túi nylon kín</li><li>Nhiệt độ lý tưởng: 7–10 độ C</li></ul><h2>Hành củ - cần thông thoáng</h2><p>Để hành trong rổ hoặc túi lưới, không dùng túi nylon. Hành đã bóc vỏ nên bọc kín trong tủ lạnh và dùng trong một đến hai tuần.</p><h2>Tỏi - đơn giản nhất</h2><p>Tỏi cả đầu có thể để được 3–6 tháng ở nhiệt độ phòng. Tránh để khoai, hành và tỏi cạnh nhau vì hơi ẩm làm chúng nhanh hỏng.</p>'
WHERE mabv = 8;

UPDATE bai_viet SET
  tieu_de = 'Câu Chuyện Từ Nông Trại: Hành Trình Của Bó Rau Từ Đất Đến Tay Bạn',
  mo_ta_ngan = 'Đằng sau mỗi bó rau là câu chuyện của những người nông dân thức khuya dậy sớm, chăm chút từng luống đất để mang đến sản phẩm tươi ngon nhất.',
  noi_dung = '<h2>4 giờ sáng - khi cả nhà còn ngủ</h2><p>Anh Nguyễn Văn Tâm, 52 tuổi, nông dân trồng rau ở Củ Chi đã có 20 năm gắn bó với ruộng rau. Mỗi ngày anh thức lúc 4 giờ sáng để hái rau còn đẫm sương.</p><blockquote>“Rau mà hái nắng lên rồi thì héo nhanh lắm, bán không được giá.”</blockquote><h2>Quy trình chăm sóc không phân hóa học</h2><p>Anh Tâm chuyển sang canh tác hữu cơ từ năm 2018. Dù năng suất giai đoạn đầu giảm, rau ngon hơn và được người tiêu dùng yêu chuộng hơn.</p><h2>Từ ruộng đến xe lạnh trong hai tiếng</h2><p>Sau thu hoạch, rau được chọn lọc tại chỗ, xếp vào thùng có nước đá. Xe lạnh Chợ Nông Sản đến lấy trước 7 giờ sáng.</p>'
WHERE mabv = 9;

UPDATE bai_viet SET
  tieu_de = '5 Món Ngon Từ Rau Củ Theo Mùa - Vừa Ngon Vừa Bổ Dưỡng',
  mo_ta_ngan = 'Ăn theo mùa giúp tiết kiệm chi phí, đảm bảo rau củ ngon và bổ dưỡng nhất vì được thu hoạch đúng thời điểm.',
  noi_dung = '<h2>Món 1: Canh rau muống nấu tỏi</h2><p>Phi thơm tỏi, đổ nước đun sôi rồi cho rau muống vào. Đậy nắp hai phút, nêm vừa ăn và tắt bếp ngay khi rau vừa chín.</p><h2>Món 2: Cà chua nhồi thịt hấp</h2><p>Trộn thịt xay với nấm mèo, hành lá và gia vị. Nhồi vào cà chua rồi hấp 15–18 phút.</p><h2>Món 3: Xào cải ngọt tỏi gừng</h2><p>Phi tỏi gừng ở lửa lớn, cho cải vào xào nhanh. Không xào quá ba phút để rau giữ được độ giòn xanh.</p><h2>Món 4: Súp khoai tây cà rốt</h2><p>Xào hành tỏi với bơ, thêm khoai tây và cà rốt rồi nấu mềm. Xay nhuyễn và nêm kem tươi tùy khẩu vị.</p><h2>Món 5: Salad rau củ trộn dầu mè</h2><p>Trộn dầu mè, giấm gạo, đường và muối thành nước sốt. Xếp rau ra đĩa, rưới sốt và rắc hạt mè rang.</p>'
WHERE mabv = 10;

UPDATE bai_viet SET
  tieu_de = 'Rau Củ Mùa Này Đang Ngon Nhất - Đừng Bỏ Lỡ 8 Loại Này',
  mo_ta_ngan = 'Mỗi mùa đều có rau củ đang ở giai đoạn ngon và rẻ nhất. Biết chọn đúng mùa vụ giúp tiết kiệm mà vẫn có nguyên liệu tươi ngon nhất.',
  noi_dung = '<h2>1. Cà chua - đang vào mùa thu hoạch rộ</h2><p>Cà chua đang trong mùa cao điểm từ Đà Lạt và Hà Nam. Quả to, đỏ đều, vị ngọt đậm. Giá đang ở mức thấp nhất trong năm.</p><h2>2. Bắp cải - ngọt và giòn nhất vừa mùa lạnh</h2><p>Bắp cải cần thời tiết mát để phát triển tốt. Thu hoạch cuối năm thường chắc tay, lá nhiều và vị ngọt thanh đặc trưng.</p><h2>3. Cà rốt Đà Lạt - đang vụ chính</h2><p>Màu cam đậm đẹp, vị ngọt tự nhiên và ít xơ. Ngon nhất Việt Nam nhờ khí hậu cao nguyên.</p><h2>4. Súp lơ trắng và xanh</h2><p>Chọn quả có hoa đều màu, chắc tay, chưa có đốt nâu. Rất giàu vitamin C.</p><h2>5. Khoai lang tím Nhật</h2><p>Đang vụ thu hoạch từ miền Trung. Vị ngọt bùi, màu tím đẹp, giàu anthocyanin chống oxy hóa.</p><h2>6. Rau cải ngọt và cải thìa</h2><p>Thời tiết mát là điều kiện lý tưởng. Lá xanh mướt, thân giòn, ít sâu bệnh.</p><h2>7. Nấm các loại</h2><p>Mùa thu đông là mùa của nấm. Đông cô tươi, nấm rơm, kim châm đang dồi dào và giá hợp lý.</p><h2>8. Đậu Hà Lan</h2><p>Đang vào mùa hái tươi. Ngọt tự nhiên, chọn quả vỏ xanh tươi, bấm vào nghe sần sật là đạt.</p>'
WHERE mabv = 11;
