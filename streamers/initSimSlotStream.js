const SimSlotActionEvent = require('../models/SimSlotActionEvent');

module.exports = function initSimSlotStream(io) {
  const pipeline = [
    { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
  ];
  const stream = SimSlotActionEvent.watch(pipeline, { fullDocument: 'updateLookup' });

  stream.on('change', change => {
    const doc = change.fullDocument;
    if (!doc || ![1, 2].includes(doc.simSlot)) return;

    io.emit('simSlotUpdate', {
      uniqueid:   doc.uniqueid,
      simSlot:    doc.simSlot,
      actionType: doc.actionType
    });
    console.log(
      `[Stream] uniqueid=${doc.uniqueid}, slot=${doc.simSlot}, action=${doc.actionType}`
    );
  });

  stream.on('error', err => console.error('[Stream error]', err));
};