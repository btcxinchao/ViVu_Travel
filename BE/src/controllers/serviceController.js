const Service = require("../models/Service.js");
const { parseItineraryExcelBuffer } = require("../utils/itineraryExcelParser.js");
const behaviorService = require("../services/behaviorService.js");
const {
  normalizeServiceBody,
  validateServicePayload,
  validateItineraryFile,
  validateApproveRejectService,
  validateGetServicesQuery,
} = require("../validations/serviceValidation.js");

// Hàm lấy itinerary từ file Excel nếu FE upload file, hoặc từ body cũ nếu còn gửi JSON.
const resolveItineraryPayload = (bodyItinerary, file) => {
  if (file) {
    return parseItineraryExcelBuffer(file.buffer);
  }

  if (!bodyItinerary) {
    return undefined;
  }

  if (Array.isArray(bodyItinerary)) {
    return bodyItinerary;
  }

  if (typeof bodyItinerary === "string") {
    const text = bodyItinerary.trim();
    if (!text) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

//  LẤY DANH SÁCH TOUR (PUBLIC) 
module.exports.getAllServices = async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = validateGetServicesQuery(req.query).data;

    // Xây dựng bộ lọc
    const query = { status: "active" };

    if (search) {
      query.serviceName = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    if (minPrice || maxPrice) {
      query.prices = {};
      if (minPrice) query.prices.$gte = Number(minPrice);
      if (maxPrice) query.prices.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate("category", "categoryName")
      .populate("provider_id", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: services,
    });
  } catch (error) {
    console.error("Lỗi getAllServices:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  CHI TIẾT TOUR (PUBLIC) 
module.exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("category")
      .populate("provider_id", "fullName phone email");

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }
    return res.status(200).json({ data: service });
  } catch (error) {
    console.error("Lỗi getServiceById:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PUBLIC] TĂNG LƯỢT XEM TOUR
module.exports.incrementServiceView = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { returnDocument: "after" },
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    const behaviorServiceDoc = await Service.findById(id).populate(
      "category",
      "categoryName slug",
    );

    await behaviorService
      .recordBehavior({
        userId: req.user?.id || null,
        guestId: req.guestId || "",
        actionType: "view",
        service: behaviorServiceDoc,
        payload: {
          source: "service_view",
        },
      })
      .catch((error) => {
        console.error("Loi record view behavior:", error);
      });

    return res.status(200).json({
      message: "Tăng lượt xem thành công",
      data: {
        id: updatedService._id,
        viewCount: updatedService.viewCount || 0,
      },
    });
  } catch (error) {
    console.error("Loi incrementServiceView:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  TẠO TOUR MỚI (PROVIDER) 
module.exports.createService = async (req, res) => {
  try {
    // Hàm này tạo service mới và đọc lịch trình từ file Excel nếu FE gửi file lên.
    const validation = validateServicePayload(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const payload = validation.data;
    const itinerary = resolveItineraryPayload(req.body.itinerary, req.file);
    const itineraryValidation = validateItineraryFile(req.file, itinerary);
    if (!itineraryValidation.isValid) {
      return res
        .status(itineraryValidation.status)
        .json({ message: itineraryValidation.message });
    }

    const newService = new Service({
      ...payload,
      itinerary: itinerary || [],
      provider_id: req.user.id,
      status: "pending", // Mặc định chờ duyệt dù model để active
    });

    await newService.save();
    return res.status(201).json({
      message: "Tạo tour thành công, chờ admin duyệt",
      data: newService,
    });
  } catch (error) {
    console.error("Lỗi createService:", error);
    return res
      .status(500)
      .json({ message: "Lỗi dữ liệu đầu vào hoặc hệ thống" });
  }
};

//  CẬP NHẬT TOUR (PROVIDER) 
module.exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service)
      return res.status(404).json({ message: "Tour không tồn tại" });

    // Kiểm tra quyền sở hữu
    if (service.provider_id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa tour này" });
    }

    // Hàm này cập nhật service và chỉ thay lịch trình khi FE upload file Excel mới.
    const payload = normalizeServiceBody(req.body);
    const itinerary = resolveItineraryPayload(req.body.itinerary, req.file);
    const updateData = {
      ...payload,
      status: "pending", // Sửa xong thì chờ duyệt lại
    };

    if (req.file) {
      const itineraryValidation = validateItineraryFile(req.file, itinerary);
      if (!itineraryValidation.isValid) {
        return res
          .status(itineraryValidation.status)
          .json({ message: itineraryValidation.message });
      }
      updateData.itinerary = itinerary;
    } else if (Array.isArray(itinerary)) {
      updateData.itinerary = itinerary;
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" },
    );

    return res
      .status(200)
      .json({ message: "Cập nhật thành công", data: updatedService });
  } catch (error) {
    console.error("Lỗi updateService:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  XÓA TOUR (PROVIDER) 
module.exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res.status(404).json({ message: "Tour không tồn tại" });

    if (service.provider_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Không có quyền xóa" });
    }

    await Service.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Đã xóa tour thành công" });
  } catch (error) {
    console.error("Lỗi deleteService:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  LẤY TOUR CỦA TÔI (PROVIDER) 
module.exports.getMyServices = async (req, res) => {
  try {
    const query = { provider_id: req.user.id };
    const services = await Service.find(query)
      .populate("category", "categoryName slug")
      .sort({
        createdAt: -1,
      });
    const total = await Service.countDocuments(query);
    return res.status(200).json({ total, data: services });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  [ADMIN] LẤY DANH SÁCH TOUR CHỜ DUYỆT 
module.exports.getPendingServices = async (req, res) => {
  try {
    // Chỉ lấy các tour có trạng thái là 'pending'
    const pendingServices = await Service.find({ status: "pending" })
      .populate("category", "categoryName")
      .populate("provider_id", "fullName email")
      .sort({ createdAt: 1 }); // Tour cũ nhất hiện lên trước để duyệt trước

    return res.status(200).json({
      count: pendingServices.length,
      data: pendingServices,
    });
  } catch (error) {
    console.error("Lỗi getPendingServices:", error);
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống khi lấy danh sách chờ duyệt" });
  }
};

//  [ADMIN] DUYỆT HOẶC TỪ CHỐI TOUR 
module.exports.approveRejectService = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateApproveRejectService(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }
    const { status } = validation.data;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    service.status = status;
    await service.save();

    return res.status(200).json({
      message:
        status === "active" ? "Đã duyệt tour thành công" : "Đã từ chối tour",
      data: service,
    });
  } catch (error) {
    console.error("Lỗi approveRejectService:", error);
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống khi xử lý duyệt tour" });
  }
};
