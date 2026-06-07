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

// ================= BROAD ALGORITHMIC MATCHING SUITE =================
exports.getAlgorithmicMatches = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.params.id; 
    
    const client = await Customer.findById(customerId);
    if (!client) {
      return res.status(404).json({ message: "Client profile not found." });
    }

    const clientReligion = (client.religion || "").toLowerCase();
    const clientCaste = (client.caste || "").toLowerCase();
    const clientCity = (client.city || "").toLowerCase();

    const topMatches = await Customer.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(customerId) }, 
          gender: client.gender === 'Male' ? 'Female' : 'Male',  
          maritalStatus: client.maritalStatus
        }
      },
      {
        $addFields: {
          structuralScore: {
            $add: [
              50, 
              {
                $cond: [
                  { $eq: [ { $toLower: { $ifNull: ["$religion", ""] } }, clientReligion ] },
                  20,
                  0
                ]
              },
              {
                $cond: [
                  { $eq: [ { $toLower: { $ifNull: ["$caste", ""] } }, clientCaste ] },
                  15,
                  0
                ]
              },
              {
                $cond: [
                  { $eq: [ { $toLower: { $ifNull: ["$city", ""] } }, clientCity ] },
                  10,
                  0
                ]
              },
              {
                $cond: [
                  { $eq: [ "$wantKids", client.wantKids ] },
                  10,
                  {
                    $cond: [
                      {
                        $or: [
                          { $and: [ { $eq: [ "$wantKids", "Yes" ] }, { $eq: [ client.wantKids, "No" ] } ] },
                          { $and: [ { $eq: [ "$wantKids", "No" ] }, { $eq: [ client.wantKids, "Yes" ] } ] }
                        ]
                      },
                      -25, 
                      0
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      { $sort: { structuralScore: -1 } }
    ]);

    const formattedMatches = topMatches.map(matchProfile => ({
      profile: matchProfile,
      // 💡 Fixed: Case-insensitive criteria check ensures badges like "Caste Match" render correctly
      matchingCriteria: [
        (matchProfile.religion || "").toLowerCase() === clientReligion ? "Religion Match" : null,
        (matchProfile.caste || "").toLowerCase() === clientCaste ? "Caste Match" : null,
        (matchProfile.city || "").toLowerCase() === clientCity ? "Location Match" : null
      ].filter(Boolean)
    }));

    res.status(200).json(formattedMatches);
  } catch (error) {
    console.error("Database Engine Optimization Error:", error);
    res.status(500).json({ message: "Failed to optimize match retrieval streams", error: error.message });
  }
};

// ================= AI COMPLIANCE ENGINE WITH RELIGION RANKING MATRIX =================
exports.getAIMatchAnalysis = async (req, res) => {
  try {
    const { clientId, matchId } = req.body;
    
    const client = await Customer.findById(clientId);
    const match = await Customer.findById(matchId);

    if (!client || !match) {
      return res.status(404).json({ message: "Profiles not found in active database directories." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const calculateAge = (dob) => {
      if (!dob) return "N/A";
      return new Date().getFullYear() - new Date(dob).getFullYear() + " Yrs";
    };

    const prompt = `
      You are the Chief Relationship Matrix Architect for "The Date Crew". 
      Perform a deep-dive, professional matching evaluation between two individuals, running a strict granular analysis across every single profile attribute provided.

      ===================================================================
      CLIENT A (PRIMARY CLIENT DOSSIER)
      ===================================================================
      • Personal Identity: ${client.firstName} ${client.lastName} (${client.gender})
      • Timeline / Dimensions: Age: ${calculateAge(client.dateOfBirth)} | Height: ${client.height || 'N/A'} cm
      • Cultural / Lineage Blueprint: Religion: ${client.religion} | Caste: ${client.caste} | Languages Known: ${client.languagesKnown || 'N/A'}
      • Professional Tracker: Designation: ${client.designation} at ${client.company} | Income: ${client.income || '0'} LPA
      • Academic Foundation: Degree: ${client.degree} | College: ${client.college}
      • Socio-Demographics: Location: ${client.city}, ${client.country || 'India'} | Marital Status: ${client.maritalStatus} | Siblings: ${client.siblings || 'None'}
      • Future Core Preferences: Wants Kids: ${client.wantKids} | Open to Relocate: ${client.openToRelocate} | Open to Pets: ${client.openToPets}

      ===================================================================
      CLIENT B (POTENTIAL MATCH CANDIDATE)
      ===================================================================
      • Personal Identity: ${match.firstName} ${match.lastName} (${match.gender})
      • Timeline / Dimensions: Age: ${calculateAge(match.dateOfBirth)} | Height: ${match.height || 'N/A'} cm
      • Cultural / Lineage Blueprint: Religion: ${match.religion} | Caste: ${match.caste} | Languages Known: ${match.languagesKnown || 'N/A'}
      • Professional Tracker: Designation: ${match.designation} at ${match.company} | Income: ${match.income || '0'} LPA
      • Academic Foundation: Degree: ${match.degree} | College: ${match.college}
      • Socio-Demographics: Location: ${match.city}, ${match.country || 'India'} | Marital Status: ${match.maritalStatus} | Siblings: ${match.siblings || 'None'}
      • Future Core Preferences: Wants Kids: ${match.wantKids} | Open to Relocate: ${match.openToRelocate} | Open to Pets: ${match.openToPets}

      ===================================================================
      STRICT EVALUATION MANDATE PROTOCOLS
      ===================================================================
      1. compatibilityScore Calculation: Compute an integer between 45 and 98. Calculate this dynamically based on data. Reward heavily (+10 to +15 points) for shared Religion and Caste lineage sync.
      2. Detailed Strengths: Provide exactly three highly detailed sentences using their explicit first names. Sentence 1 logs professional status, Sentence 2 logs cultural lineage metrics, and Sentence 3 logs core preference alignment.
      3. Friction Risk Assessment (Challenges):
      - Provide exactly two analytical sentences flagging structural differences.
      - Detail active friction parameters like geographic proximity elements (ONLY if they live in DIFFERENT cities or countries), professional timeline balances, or variance in preference layouts.
      - CRITICAL: If both individuals live in the same city, DO NOT call it a challenge or state that it lacks geographical diversity. Proximity is a strength. Instead, focus on minor professional timeline gaps or lifestyle differences.
      Return ONLY a raw, unquoted JSON object matching the JSON schema format below. Do NOT use placeholder values from the example layout schema directly; compute the compatibilityScore value completely dynamically from your analysis:
      {
        "compatibilityScore": YOUR_DYNAMICALLY_CALCULATED_INTEGER_HERE,
        "strengths": [
          "Sentence 1 detailing professional workspace metrics.",
          "Sentence 2 detailing cultural religion and caste lineage sync.",
          "Sentence 3 detailing lifestyle choice layouts."
        ],
        "challenges": [
          "Sentence 1 detailing geographic or background friction metrics.",
          "Sentence 2 detailing long-term adjustment notes."
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4, // Slight increase allows the model to calculate varied scores naturally
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0].message.content.trim();
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error("Groq Prompt Pipeline Intercept Error:", error.message);
    res.status(500).json({ message: "Internal analysis loop error", error: error.message });
  }
};