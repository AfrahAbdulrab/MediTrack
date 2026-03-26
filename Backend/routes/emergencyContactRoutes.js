const express = require("express");
const router = express.Router();
const EmergencyContact = require("../models/EmergencyContact");

// ========================================
// 📥 GET - User ke saare contacts fetch karo
// ========================================
// URL: GET /api/emergency-contacts/user/:userId
// Example: GET /api/emergency-contacts/user/690c4c93f611241fa1fc43f5

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 Fetching contacts for user: ${userId}`);
    
    // Database se is user ke saare contacts nikalo
    const contacts = await EmergencyContact.find({ userId })
      .sort({ isPrimary: -1, createdAt: -1 }); // Primary contacts pehle
    
    res.json({
      success: true,
      count: contacts.length,
      contacts: contacts,
    });
  } catch (error) {
    console.error("❌ Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
});

// ========================================
// 🚨 POST - Alert bhejo SAARE contacts ko
// ========================================
// URL: POST /api/emergency-contacts/send-alert
// Body: { userId, alertMessage, vitalsData }
// Description: Ye endpoint user ke saare emergency contacts ko SMS ke liye data return karega

router.post("/send-alert", async (req, res) => {
  try {
    const { userId, alertMessage, vitalsData } = req.body;
    
    console.log(`🚨 Alert request for user: ${userId}`);

    // ✅ Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ User ke saare emergency contacts fetch karo
    const contacts = await EmergencyContact.find({ userId })
      .sort({ isPrimary: -1, createdAt: -1 });

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No emergency contacts found for this user",
      });
    }

    // ✅ Default alert message
    const defaultMessage = "🚨 HEALTH ALERT: Abnormal vitals detected! Please check immediately.";
    const finalMessage = alertMessage || defaultMessage;

    // ✅ Saare contacts ka data return karo
    const contactList = contacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary
    }));

    console.log(`✅ Found ${contacts.length} contacts to alert`);

    res.json({
      success: true,
      message: "Emergency contacts retrieved successfully",
      count: contacts.length,
      contacts: contactList,
      alertMessage: finalMessage,
      vitalsData: vitalsData || null,
    });

  } catch (error) {
    console.error("❌ Error sending alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send alert",
      error: error.message,
    });
  }
});

// ========================================
//  POST - Naya contact add karo
// ========================================
// URL: POST /api/emergency-contacts/add
// Body: { userId, name, phone, relationship, isPrimary }

router.post("/add", async (req, res) => {
  try {
    const { userId, name, phone, relationship, isPrimary } = req.body;
    
    console.log('➕ Adding contact:', { userId, name, phone, relationship });

    // ✅ Validation - Saare fields required hain
    if (!userId || !name || !phone || !relationship) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Naya contact banao
    const newContact = new EmergencyContact({
      userId,
      name,
      phone,
      relationship,
      isPrimary: isPrimary || false,
    });

    // ✅ Database mein save karo
    await newContact.save();
    console.log('✅ Contact added successfully');

    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      contact: newContact,
    });
  } catch (error) {
    console.error("❌ Error adding contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add contact",
      error: error.message,
    });
  }
});

// ========================================
// ✏️ PUT - Contact update karo
// ========================================
// URL: PUT /api/emergency-contacts/update/:contactId
// Body: { name, phone, relationship }

router.put("/update/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, phone, relationship } = req.body;
    
    console.log(`✏️ Updating contact: ${contactId}`);

    // ✅ Contact find karke update karo
    const updatedContact = await EmergencyContact.findByIdAndUpdate(
      contactId,
      { name, phone, relationship },
      { new: true, runValidators: true } // Updated document return karo
    );

    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    console.log('✅ Contact updated successfully');

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact: updatedContact,
    });
  } catch (error) {
    console.error("❌ Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact",
      error: error.message,
    });
  }
});

// ========================================
// 🗑️ DELETE - Contact delete karo
// ========================================
// URL: DELETE /api/emergency-contacts/delete/:contactId

router.delete("/delete/:contactId", async (req, res) => {
  try {
    const { contactId } = req.params;
    console.log(`🗑️ Deleting contact: ${contactId}`);

    // ✅ Contact find karke delete karo
    const deletedContact = await EmergencyContact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    console.log('✅ Contact deleted successfully');

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message,
    });
  }
});

module.exports = router;