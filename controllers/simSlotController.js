const SimSlotActionEvent = require('../models/SimSlotActionEvent');

// ─── POST /api/device/sim-slot-event ─────────────────────────────
exports.handleSimSlotEvent = async (req, res) => {
  const { uniqueid, slotActions } = req.body;

  // Validate uniqueid
  if (!uniqueid || typeof uniqueid !== 'string' || !uniqueid.trim()) {
    return res.status(400).json({ success: false, message: 'uniqueid is required and must be a non-empty string' });
  }

  // Validate slotActions array
  if (!Array.isArray(slotActions) || slotActions.length === 0) {
    return res.status(400).json({ success: false, message: 'slotActions must be a non-empty array' });
  }

  let ops;
  try {
    ops = slotActions.map((item, index) => {
      if (typeof item !== 'object' || item == null) {
        throw new Error(`slotActions[${index}] must be a valid object`);
      }

      let simSlotNum;

      // Handle both "SIM 1", "SIM 2" and raw numbers
      if (typeof item.simSlot === 'string') {
        const match = item.simSlot.match(/SIM\s*(\d+)/i);
        simSlotNum = match ? Number(match[1]) : Number(item.simSlot);
      } else {
        simSlotNum = Number(item.simSlot);
      }

      // Validate simSlot and actionType
      if (![1, 2].includes(simSlotNum)) {
        throw new Error(`slotActions[${index}].simSlot must be 1 or 2 (got "${item.simSlot}")`);
      }

      if (!['register', 'erase'].includes(item.actionType)) {
        throw new Error(`slotActions[${index}].actionType must be 'register' or 'erase' (got "${item.actionType}")`);
      }

      return {
        updateOne: {
          filter: { uniqueid: uniqueid.trim(), simSlot: simSlotNum },
          update: {
            $set: {
              actionType: item.actionType,
              timestamp: new Date()
            }
          },
          upsert: true
        }
      };
    });
  } catch (validationError) {
    console.error('Validation error:', validationError.message);
    return res.status(400).json({ success: false, message: validationError.message });
  }

  try {
    await SimSlotActionEvent.bulkWrite(ops, { ordered: true });
    return res.json({ success: true, message: 'SIM-slot events upserted successfully' });
  } catch (err) {
    console.error('Bulk write error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not save SIM-slot events' });
  }
};

// ─── GET /api/device/status/:uniqueid ────────────────────────────
exports.getSimSlotStatus = async (req, res) => {
  const uniqueid = req.params.uniqueid;

  if (!uniqueid || typeof uniqueid !== 'string' || !uniqueid.trim()) {
    return res.status(400).json({ success: false, message: 'uniqueid is required' });
  }

  try {
    const events = await SimSlotActionEvent.aggregate([
      { $match: { uniqueid } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$simSlot', actionType: { $first: '$actionType' } } }
    ]);

    const status = { '1': null, '2': null };
    events.forEach(e => {
      status[e._id.toString()] = e.actionType;
    });

    return res.json({ success: true, status });
  } catch (err) {
    console.error('Aggregation error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch SIM-slot status' });
  }
};