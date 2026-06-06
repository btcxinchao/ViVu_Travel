const Provider = require("../models/Provider.js");

module.exports.getInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id).populate(
      "providerID",
      "fullName email phone role status createdAt",
    );

    if (!provider) {
      return res.status(404).json({ message: "Khong tim thay provider" });
    }

    return res.status(200).json({
      message: "Lay thong tin provider thanh cong",
      data: provider,
    });
  } catch (error) {
    console.error("Loi getInfo provider:", error);
    return res.status(500).json({ message: "Loi server" });
  }
};

module.exports.getMyProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ providerID: req.user.id }).populate(
      "providerID",
      "fullName email phone role status createdAt",
    );

    if (!provider) {
      return res.status(404).json({ message: "Chua co ho so provider" });
    }

    return res.status(200).json({
      message: "Lay ho so provider thanh cong",
      data: provider,
    });
  } catch (error) {
    console.error("Loi getMyProviderProfile:", error);
    return res.status(500).json({ message: "Loi server" });
  }
};
