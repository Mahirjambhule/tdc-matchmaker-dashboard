const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  const birthYear = new Date(dobString).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

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

    const isClientMale = client.gender === 'Male';

    const topMatches = await Customer.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(customerId) },
          gender: isClientMale ? 'Female' : 'Male',
          religion: client.religion,
          
          $expr: {
            $cond: [
              isClientMale,
              {
                $and: [
                  { $gt: [{ $year: "$dateOfBirth" }, clientBirthYear] }, 
                  { $lte: [{ $ifNull: ["$height", 0] }, client.height || 999] },
                  { $lte: [{ $ifNull: ["$income", 0] }, client.income || 999] }
                ]
              },
              {
                $and: [
                  { $lt: [{ $year: "$dateOfBirth" }, clientBirthYear] }, 
                  { $gte: [{ $ifNull: ["$height", 0] }, client.height || 0] },
                  { $gte: [{ $ifNull: ["$income", 0] }, client.income || 0] }
                ]
              }
            ]
          }
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
              
              {
                $let: {
                  vars: { ageGap: { $abs: { $subtract: [clientAge, { $subtract: [currentYear, { $year: "$dateOfBirth" }] }] } } },
                  in: {
                    $cond: [
                      { $and: [{ $gte: ["$$ageGap", 2] }, { $lte: ["$$ageGap", 5] }] }, 
                      40, 
                      10  
                    ]
                  }
                }
              },
              
              {
                $cond: [
                  isClientMale,
                  { $cond: [{ $lt: [{ $ifNull: ["$height", 0] }, client.height] }, 30, 10] }, 
                  { $cond: [{ $gt: [{ $ifNull: ["$height", 0] }, client.height] }, 30, 10] }  
                ]
              },
              
              {
                $cond: [
                  isClientMale,
                  { $cond: [{ $lt: ["$income", client.income] }, 20, 10] }, 
                  { $cond: [{ $gt: ["$income", client.income] }, 20, 10] }  
                ]
              }
            ]
          }
        }
      },
      
      { $sort: { structuralScore: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json(topMatches.map(match => ({ profile: match, matchingCriteria: ["Religion Matched", "Traditional Hierarchy Check Passed"] })));
  } catch (error) {
    res.status(500).json({ message: "Error compiling filtered match directory", error: error.message });
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
      You are the Lead Relationship Intelligence Architect for "The Date Crew" management dashboard.
      Perform an exhaustive, data-driven compatibility evaluation between the following two individuals. You must conduct an intersectional analysis focusing deeply on lifestyle, structural, and cultural variables.

      ===================================================================
      PRIMARY CLIENT DOSSIER
      ===================================================================
      • Full Identity: ${client.firstName} ${client.lastName} (${client.gender})
      • Marital Status: ${client.maritalStatus || 'N/A'}
      • Current City: ${client.city || 'N/A'}
      • Career Track: ${client.designation || 'N/A'} at ${client.company || 'N/A'}
      • Academic Foundation: ${client.degree || 'N/A'} from ${client.college || 'N/A'}
      • Dietary Profile: ${client.diet || client.dietaryPreference || 'N/A'}
      • Value Matrix: ${client.familyValues || client.coreValues || 'N/A'}
      • Relocation Mobility: ${client.openToRelocate || 'N/A'}
      • Pet Compatibility: ${client.openToPets || 'N/A'}
      • Procreation Intentions: ${client.wantKids || 'N/A'}

      ===================================================================
      POTENTIAL MATCH CANDIDATE DOSSIER
      ===================================================================
      • Full Identity: ${match.firstName} ${match.lastName} (${match.gender})
      • Marital Status: ${match.maritalStatus || 'N/A'}
      • Current City: ${match.city || 'N/A'}
      • Career Track: ${match.designation || 'N/A'} at ${match.company || 'N/A'}
      • Academic Foundation: ${match.degree || 'N/A'} from ${match.college || 'N/A'}
      • Dietary Profile: ${match.diet || match.dietaryPreference || 'N/A'}
      • Value Matrix: ${match.familyValues || match.coreValues || 'N/A'}
      • Relocation Mobility: ${match.openToRelocate || 'N/A'}
      • Pet Compatibility: ${match.openToPets || 'N/A'}
      • Procreation Intentions: ${match.wantKids || 'N/A'}

      ===================================================================
      STRICT MANDATE PROTOCOLS FOR THE ANALYSIS
      ===================================================================
      1. compatibilityScore Matrix: Output an integer from 45 to 98. Weigh matching values, shared dietary paths, geographic proximity, and marital status alignment highly.
      2. Comprehensive Strengths: Provide exactly 3 highly descriptive sentences utilizing their first names (${client.firstName} and ${match.firstName}).
         - Sentence 1: Analyze how their City proximity or Relocation flexibility combined with professional landscapes align.
         - Sentence 2: Contrast and highlight their Education Background and career trajectory synergy.
         - Sentence 3: Target the alignment of their Dietary Preferences, Pet stances, and Wants Children outlook. Praise them if both share the same Marital Status (e.g., both Never Married or both Divorced).
      3. Friction Point Assessments (Challenges): Provide exactly 2 distinct sentences identifying challenges.
         - Analyze conflicts between Core Values (e.g., Traditional vs Liberal), contrasting relocation preferences, or potential adjustments in lifestyle metrics.
         - CRITICAL MARITAL STATUS CHECK: Evaluate if there is a mismatch in Marital Status (e.g., one is 'Never Married' while the other is 'Divorced'). If a mismatch exists, explicitly detail the potential social, familial, or emotional adjustment barriers this introduces.
         - CRITICAL GEOGRAPHY CHECK: If they live in the same city, praise it in strengths; DO NOT mark it as a geographic challenge.

      Return ONLY a raw, unquoted JSON object matching the template below. No markdown text, no surrounding text block wrappers:
      {
        "compatibilityScore": ANY_INTEG_VALUE_HERE,
        "strengths": [
          "Sentence 1 details city proximity, mobility, and workspace metrics.",
          "Sentence 2 details education backgrounds and professional trajectories sync.",
          "Sentence 3 details dietary preferences, values, pets, and children/marital status alignment."
        ],
        "challenges": [
          "Sentence 1 highlights core values friction, relocation limitations, or marital status adjustments.",
          "Sentence 2 highlights lifestyle compromises or adjustment vectors."
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0].message.content.trim();
    res.status(200).json(JSON.parse(responseContent));
  } catch (error) {
    console.error("Groq Engine Exception Log:", error.message);
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