const multer = require("multer");
const { cloudinary } = require("../config/cloudinary.js");
const Service = require("../models/Service.js");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1, // 1MB
  },
});

const uploadImageFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "tour/category",
        resource_type: "image",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(buffer);
  });
};
const uploadService = async (req, res) => {
  try {
    const file = req.file;
    const serviceId = req.service._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      {
        imageUrl: result.secure_url,
        imageId: result.public_id,
      },
      {
        returnDocument: "after",
      },
    ).select("imageUrl");

    if (!updatedService.imageUrl) {
      return res.status(400).json({ message: "service trả về null" });
    }

    return res.status(200).json({ imageUrl: updatedService.imageUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload service", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

module.exports = { upload, uploadImageFromBuffer, uploadService };
