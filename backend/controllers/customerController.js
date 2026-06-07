const Groq = require('groq-sdk');
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
    const { id } = req.params;
    const client = await Customer.findById(id);

    if (!client) {
      return res.status(404).json({ message: "Client dossier not found" });
    }

    const targetGender = client.gender === 'Male' ? 'Female' : 'Male';
    
    // CHANGED: Pulling ALL candidates of the opposite gender without a religion barrier upfront
    const potentialMatches = await Customer.find({ gender: targetGender });
    
    const clientAge = new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear();
    const verifiedMatches = [];

    for (const candidate of potentialMatches) {
      const candidateAge = new Date().getFullYear() - new Date(candidate.dateOfBirth).getFullYear();
      const criteriaBadges = [];
      let isEligible = false;

      if (client.gender === 'Male') {
        // --- BASELINE MALE FILTER CRITERIA ---
        const isYounger = candidateAge < clientAge;
        const earnsLess = candidate.income < client.income;
        const isShorter = candidate.height < client.height;
        const childrenMatch = candidate.wantKids === client.wantKids;

        if (isYounger && earnsLess && isShorter && childrenMatch) {
          isEligible = true;
          criteriaBadges.push("Younger Age", "Income Within Bracket", "Height Aligned", "Child Expectations Match");
        }
      } else {
        // --- BASELINE FEMALE COMPATIBILITY LOGIC ---
        const valuesMatch = candidate.familyValues === client.familyValues;
        const relocateMatch = candidate.openToRelocate === client.openToRelocate || client.openToRelocate === 'Yes' || candidate.openToRelocate === 'Yes';
        const professionalSync = candidate.income >= client.income;

        if (valuesMatch || relocateMatch || professionalSync) {
          isEligible = true;
          if (valuesMatch) criteriaBadges.push(`Shared Values (${client.familyValues})`);
          if (relocateMatch) criteriaBadges.push("Relocation Flexible");
          if (professionalSync) criteriaBadges.push("Professional Synergy");
        }
      }

      if (isEligible) {
        verifiedMatches.push({
          profile: candidate,
          matchingCriteria: criteriaBadges
        });
      }
    }

    res.json(verifiedMatches);
  } catch (err) {
    console.error("Pipeline failure:", err);
    res.status(500).json({ error: "Internal matching engine fault" });
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

    // Helper to calculate exact age strings from Date of Birth variables
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
      • Contact Registry (For System Ref): Email: ${client.email} | Phone: ${client.phone}

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
      • Contact Registry (For System Ref): Email: ${match.email} | Phone: ${match.phone}

      ===================================================================
      STRICT EVALUATION MANDATE PROTOCOLS
      ===================================================================
      1. compatibilityScore Calculation: 
         - Compute an integer between 45 and 98.
         - Reward heavily (+10 to +15 points) for shared Religion and Caste lineage sync.
         - Evaluate background synergy, location layout metrics, future life goals (Kids/Relocation), and professional tracks.
         - Apply calculated penalties if there are clear contradictions (e.g., if one explicitly wants kids and the other doesn't, or severe income/location mismatches).

      2. Detailed Strengths:
         - Provide exactly three highly detailed, professional sentences.
         - Sentence 1 must evaluate their professional status, educational benchmarks, and career synergy.
         - Sentence 2 must evaluate cultural alignment, ancestral lineage parameters (Religion/Caste), and language compatibility.
         - Sentence 3 must evaluate lifestyle choices, family integration (Siblings/Marital status), and core future paths (Kids/Pets/Relocation).
         - Always use explicit names to keep the output highly tailored.

      3. Friction Risk Assessment (Challenges):
         - Provide exactly two analytical sentences flagging structural differences.
         - Detail geographic proximity elements (City/Country gaps), professional timeline balances, or variance in preference layouts.

      Return ONLY a clean JSON object following this exact syntax scheme. Do not provide prose preamble or markdown labels outside the JSON block:
      {
        "compatibilityScore": 92,
        "strengths": [
          "First highly detailed professional sentence analyzing workspace, degrees, and earnings.",
          "Second highly detailed cultural sentence analyzing lineage, religion, caste, and communication compatibility.",
          "Third highly detailed preference sentence analyzing future tracks regarding relocation, domestic layouts, and family expansion parameters."
        ],
        "challenges": [
          "First analytical friction challenge sentence tracking structural differences.",
          "Second analytical friction challenge sentence evaluating long-term lifestyle adjustment notes."
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower temperature forces deterministic, analytical reasoning outputs
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0].message.content.trim();
    const analysisData = JSON.parse(responseText);

    res.status(200).json(analysisData);
  } catch (error) {
    console.error("Groq Prompt Pipeline Intercept Error:", error.message);
    res.status(500).json({ message: "Internal analysis loop error", error: error.message });
  }
};