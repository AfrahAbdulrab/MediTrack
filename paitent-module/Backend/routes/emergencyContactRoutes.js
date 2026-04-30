const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");

// ========================================
// 📥 GET - User ke saare contacts fetch karo
// ========================================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const contacts = await EmergencyContact.find({ userId })
      .sort({ isPrimary: -1, createdAt: -1 });
    res.json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch contacts", error: error.message });
  }
});

// ========================================
// 🚨 POST - Alert bhejo SAARE contacts ko
// ========================================
router.post("/send-alert", async (req, res) => {
  try {
    const { userId, alertMessage, vitalsData } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    const contacts = await EmergencyContact.find({ userId }).sort({ isPrimary: -1, createdAt: -1 });
    if (contacts.length === 0) return res.status(404).json({ success: false, message: "No emergency contacts found" });

    const finalMessage = alertMessage || "🚨 HEALTH ALERT: Abnormal vitals detected! Please check immediately.";
    const contactList = contacts.map(c => ({
      name: c.name, phone: c.phone, relationship: c.relationship, isPrimary: c.isPrimary
    }));

    res.json({ success: true, count: contacts.length, contacts: contactList, alertMessage: finalMessage, vitalsData: vitalsData || null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send alert", error: error.message });
  }
});

// ========================================
// ➕ POST - Naya contact add karo
// ========================================
router.post("/add", async (req, res) => {
  try {
    const { userId, name, phone, email, relationship, isPrimary } = req.body;

    if (!userId || !name || !phone || !relationship) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // ✅ Duplicate check
    const existingContact = await EmergencyContact.findOne({ userId, phone: phone.trim() });
    if (existingContact) {
      return res.status(409).json({ success: false, message: "This contact has already been added" });
    }

    if (isPrimary) {
      await EmergencyContact.updateMany({ userId }, { isPrimary: false });
    }

    const newContact = new EmergencyContact({
      userId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : null, // ✅ NEW: email save karo
      relationship: relationship.trim(),
      isPrimary: isPrimary || false,
    });

    await newContact.save();

    res.status(201).json({ success: true, message: "Contact added successfully", contact: newContact });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This contact already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to add contact", error: error.message });
  }
});

// ========================================
// ✏️ PUT - Contact update karo
// ========================================
router.put("/update/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, phone, email, relationship, isPrimary, userId } = req.body;

    if (isPrimary && userId) {
      await EmergencyContact.updateMany({ userId, _id: { $ne: contactId } }, { isPrimary: false });
    }

    const updatedContact = await EmergencyContact.findByIdAndUpdate(
      contactId,
      {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }), // ✅ NEW
        ...(relationship && { relationship: relationship.trim() }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedContact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.json({ success: true, message: "Contact updated successfully", contact: updatedContact });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update contact", error: error.message });
  }
});

// ========================================
// 🗑️ DELETE - Contact delete karo
// ========================================
router.delete("/delete/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    const deletedContact = await EmergencyContact.findByIdAndDelete(contactId);
    if (!deletedContact) return res.status(404).json({ success: false, message: "Contact not found" });
    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete contact", error: error.message });
  }
});

module.exports = router;
