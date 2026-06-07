const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}, 'firstName lastName gender dateOfBirth city maritalStatus journeyStatus');
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer directory", error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile details", error: error.message });
  }
};

exports.updateCustomerStatusAndNotes = async (req, res) => {
  try {
    const { journeyStatus, newNote } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    if (journeyStatus) customer.journeyStatus = journeyStatus;
    if (newNote) customer.matchmakerNotes.push({ note: newNote });

    await customer.save();
    res.status(200).json({ message: "Profile tracking logs updated successfully", customer });
  } catch (error) {
    res.status(500).json({ message: "Error updating customer log records", error: error.message });
  }
};

exports.getAlgorithmicMatches = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.params.id;
    const client = await Customer.findById(customerId);

    if (!client) return res.status(404).json({ message: "Client not found." });

    const currentYear = new Date().getFullYear();
    const clientBirthYear = new Date(client.dateOfBirth).getFullYear();
    const clientAge = currentYear - clientBirthYear;

    const topMatches = await Customer.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(customerId) },
          gender: client.gender === 'Male' ? 'Female' : 'Male',
          religion: client.religion
        }
      },
      {
        $addFields: {
          candidateBirthYear: { $year: "$dateOfBirth" },
          candidateAge: { $subtract: [currentYear, { $year: "$dateOfBirth" }] }
        }
      },
      {
        $addFields: {
          structuralScore: {
            $add: [
              50,
              { $cond: [{ $gte: [{ $subtract: [currentYear, { $year: "$dateOfBirth" }] }, clientAge] }, 40, -60] },
              { $cond: [{ $gte: [{ $ifNull: ["$height", 0] }, { $ifNull: [client.height, 0] }] }, 30, 0] },
              {
                $cond: [
                  { $gte: ["$income", client.income] }, 20,
                  { $cond: [{ $gte: ["$income", client.income - 5] }, 10, 0] }
                ]
              }
            ]
          }
        }
      },
      { $sort: { structuralScore: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json(topMatches.map(match => ({ profile: match, matchingCriteria: ["Religion Matched"] })));
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

exports.getAIMatchAnalysis = async (req, res) => {
  try {
    const { clientId, matchId } = req.body;
    const client = await Customer.findById(clientId);
    const match = await Customer.findById(matchId);

    if (!client || !match) return res.status(404).json({ message: "Profiles not found." });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `
      Perform a deep-dive match analysis between ${client.firstName} and ${match.firstName}.
      Client: ${JSON.stringify(client)}
      Match: ${JSON.stringify(match)}
      Return JSON only: { "compatibilityScore": int, "strengths": [str, str, str], "challenges": [str, str] }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    res.status(200).json(JSON.parse(chatCompletion.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ message: "Internal analysis loop error", error: error.message });
  }
};

exports.deleteCustomerNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { $pull: { matchmakerNotes: { _id: noteId } } },
      { returnDocument: 'after' }
    );

    if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Deleted", customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: "Error deleting record", error: error.message });
  }
};