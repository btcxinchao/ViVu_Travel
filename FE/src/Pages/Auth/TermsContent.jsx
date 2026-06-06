const sections = [
  {
    title: "1. Phạm vi áp dụng",
    body: "Điều khoản này áp dụng cho các nhà cung cấp tour đăng ký, đăng bán và cung cấp tour du lịch trên nền tảng của chúng tôi. Nền tảng đóng vai trò trung gian kết nối người dùng với nhà cung cấp tour, hỗ trợ hiển thị thông tin, đặt tour, thanh toán và tiếp nhận yêu cầu hỗ trợ.",
  },
  {
    title: "2. Vai trò của các bên",
    body: "Chúng tôi là đơn vị vận hành nền tảng trung gian, cung cấp hạ tầng công nghệ để khách hàng tìm kiếm, đặt tour và thanh toán. Nhà cung cấp là đơn vị trực tiếp thiết kế, tổ chức, vận hành và chịu trách nhiệm về tính hợp pháp, nội dung, chất lượng, lịch trình, nhân sự phục vụ và an toàn của tour. Việc tour được hiển thị trên nền tảng không đồng nghĩa chúng tôi là đơn vị trực tiếp tổ chức tour.",
  },
  {
    title: "3. Điều kiện tham gia của đối tác",
    body: "Nhà cung cấp chỉ được tham gia nền tảng khi có tư cách pháp lý phù hợp, cung cấp đầy đủ hồ sơ doanh nghiệp, thông tin liên hệ, tài khoản thanh toán và các giấy phép cần thiết theo quy định pháp luật. Nhà cung cấp phải cam kết mọi thông tin, hình ảnh, lịch trình, giá bán và chính sách hủy/đổi/hoàn là trung thực, cập nhật và có thể kiểm chứng.",
  },
  {
    title: "4. Quy trình đăng bán và kiểm duyệt tour",
    body: "Nhà cung cấp đăng tải thông tin tour theo biểu mẫu của hệ thống. Chúng tôi có quyền kiểm duyệt, từ chối, yêu cầu chỉnh sửa hoặc tạm ẩn tour nếu phát hiện thông tin thiếu, sai lệch, gây hiểu nhầm, vi phạm pháp luật hoặc không phù hợp với tiêu chuẩn chất lượng của nền tảng. Nhà cung cấp có trách nhiệm chủ động cập nhật lịch khởi hành, số chỗ, giá bán, điểm đón trả và các điều kiện tham gia tour.",
  },
  {
    title: "5. Giá bán, khuyến mãi và hoa hồng",
    body: "Giá tour niêm yết trên nền tảng phải rõ ràng, minh bạch và thể hiện đầy đủ các khoản khách hàng phải thanh toán, trừ các khoản được ghi chú rõ là không bao gồm. Chúng tôi thu hoa hồng 10% trên giá trị thực thu của mỗi đơn tour thành công phát sinh trên nền tảng. Giá trị thực thu là số tiền khách hàng thanh toán thành công sau khi trừ các khoản hoàn tiền, giao dịch bị từ chối, chargeback hoặc giao dịch gian lận.",
  },
  {
    title: "6. Đặt chỗ, thanh toán và đối soát",
    body: "Khách hàng đặt tour trên nền tảng theo các bước lựa chọn tour, nhập thông tin, xác nhận đơn và thanh toán hoặc đặt cọc theo chính sách của tour. Chúng tôi có thể là đơn vị thu hộ tiền tour cho nhà cung cấp thông qua cổng thanh toán tích hợp. Sau khi hệ thống xác nhận thanh toán thành công, thông tin đơn sẽ được chuyển cho nhà cung cấp để chuẩn bị cung cấp dịch vụ. Doanh thu còn lại sau khi trừ hoa hồng và các khoản cần khấu trừ sẽ được đối soát và thanh toán cho nhà cung cấp theo chu kỳ đã thỏa thuận.",
  },
  {
    title: "7. Chính sách hủy tour và hoàn tiền",
    body: "Chính sách hủy, đổi và hoàn tiền của từng tour phải được nhà cung cấp công bố rõ ràng trước khi khách hàng thanh toán. Nhà cung cấp chịu trách nhiệm chính trong các trường hợp phải hoàn tiền cho khách do tour không thể thực hiện, chất lượng thực tế không đúng cam kết, thay đổi lịch trình trọng yếu hoặc các vi phạm xuất phát từ phía nhà cung cấp. Chúng tôi là đầu mối tiếp nhận yêu cầu hoàn tiền trên nền tảng và phối hợp với nhà cung cấp để xử lý.",
  },
  {
    title: "8. Cam kết tour của nhà cung cấp",
    body: "Nhà cung cấp cam kết tour đăng bán là có thật, lịch khởi hành có thật, số chỗ được kiểm soát và không vượt quá khả năng cung ứng thực tế. Chương trình tour, điểm tham quan, phương tiện, lưu trú, bữa ăn, hướng dẫn viên và các dịch vụ bao gồm hoặc không bao gồm phải được mô tả rõ ràng, không gây hiểu nhầm. Chất lượng tour thực tế không được thấp hơn nội dung đã công bố, trừ trường hợp bất khả kháng và đã thông báo phù hợp cho khách hàng.",
  },
  {
    title: "9. Khiếu nại và xử lý vi phạm",
    body: "Chúng tôi tiếp nhận phản ánh và khiếu nại của khách hàng qua hệ thống. Nhà cung cấp có trách nhiệm phản hồi đúng thời hạn, cung cấp bằng chứng và phối hợp xử lý sự cố. Nếu khiếu nại phát sinh do lỗi của nhà cung cấp, nhà cung cấp phải chịu trách nhiệm hoàn tiền, bồi hoàn hoặc chi trả các chi phí hợp lý cho khách hàng theo mức độ thiệt hại. Chúng tôi có quyền tạm ẩn tour, tạm khóa tài khoản hoặc tạm dừng đối soát nếu phát hiện rủi ro nghiêm trọng hoặc vi phạm lặp lại.",
  },
  {
    title: "10. Dữ liệu cá nhân và bảo mật",
    body: "Dữ liệu khách hàng chỉ được sử dụng cho mục đích xác nhận đơn, cung cấp tour, hỗ trợ khách hàng, hoàn tiền, đối soát và các mục đích hợp pháp khác đã được thông báo. Nhà cung cấp chỉ được sử dụng dữ liệu khách hàng trong phạm vi cần thiết để thực hiện tour, không được tự ý chia sẻ, chuyển giao hoặc sử dụng cho mục đích quảng cáo riêng khi chưa có căn cứ hợp pháp. Các bên có trách nhiệm bảo mật thông tin giao dịch, tài khoản và dữ liệu cá nhân của khách hàng.",
  },
  {
    title: "11. Tạm ngưng và chấm dứt hợp tác",
    body: "Chúng tôi có quyền tạm ngưng hoặc chấm dứt hợp tác nếu nhà cung cấp cung cấp hồ sơ giả mạo, thông tin không trung thực, vi phạm pháp luật, vi phạm quyền lợi người tiêu dùng, gây ảnh hưởng nghiêm trọng đến uy tín nền tảng hoặc không hợp tác xử lý sự cố. Khi chấm dứt hợp tác, các booking đã phát sinh trước đó vẫn phải tiếp tục được xử lý đến khi hoàn tất quyền lợi của khách hàng, trừ khi có thỏa thuận khác hợp pháp hơn.",
  },
  {
    title: "12. Luật áp dụng và giải quyết tranh chấp",
    body: "Điều khoản này được điều chỉnh theo pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng và thiện chí hợp tác. Trường hợp không thể tự giải quyết, tranh chấp sẽ được đưa ra cơ quan có thẩm quyền theo thỏa thuận của các bên và theo quy định pháp luật hiện hành.",
  },
];

function TermsContent() {
  return (
    <div className="space-y-5 text-left text-sm leading-6 text-slate-600">
      <div className="rounded-2xl bg-orange-50 px-4 py-4 text-slate-700">
        <p className="font-semibold text-slate-900">Lưu ý</p>
        <p className="mt-1">
          Đây là nội dung điều khoản hợp tác áp dụng cho nhà cung cấp tour đăng
          ký và vận hành dịch vụ trên nền tảng trung gian của hệ thống.
        </p>
      </div>

      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border border-slate-100 p-4"
        >
          <h4 className="text-base font-semibold text-slate-900">
            {section.title}
          </h4>
          <p className="mt-2">{section.body}</p>
        </section>
      ))}
    </div>
  );
}

export default TermsContent;
