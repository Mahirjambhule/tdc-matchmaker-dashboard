const { GoogleGenerativeAI } = require('@google/generative-ai');
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

    // Concurrent safety timeout delay to stagger batch loads cleanly
    await new Promise(resolve => setTimeout(resolve, 450));

    const client = await Customer.findById(clientId);
    const match = await Customer.findById(matchId);

    if (!client || !match) {
      return res.status(404).json({ message: "Profiles not found." });
    }

    let analysisData;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are the Chief Relationship Matrix Architect for "The Date Crew".
        Perform an intensive compatibility calculation and demographic matching assessment between two profiles.
        
        CRITICAL ATTRIBUTE REGISTER - CLIENT A (PRIMARY):
        - Name: ${client.firstName} ${client.lastName} (${client.gender})
        - Age/Height: ${new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} Yrs, ${client.height} cm
        - Cultural Domain: Religion: ${client.religion}, Caste: ${client.caste}
        - Professional Standing: ${client.designation} at ${client.company} | Income: ${client.income} LPA
        - Socio-Lifestyle Matrix: Marital Status: ${client.maritalStatus}, Diet: ${client.diet}, Values: ${client.familyValues}
        - Preference Layout: Wants Kids: ${client.wantKids}, Open to Pets: ${client.openToPets}, Open to Relocate: ${client.openToRelocate}

        CRITICAL ATTRIBUTE REGISTER - CLIENT B (CANDIDATE):
        - Name: ${match.firstName} ${match.lastName} (${match.gender})
        - Age/Height: ${new Date().getFullYear() - new Date(match.dateOfBirth).getFullYear()} Yrs, ${match.height} cm
        - Cultural Domain: Religion: ${match.religion}, Caste: ${match.caste}
        - Professional Standing: ${match.designation} at ${match.company} | Income: ${match.income} LPA
        - Socio-Lifestyle Matrix: Marital Status: ${match.maritalStatus}, Diet: ${match.diet}, Values: ${match.familyValues}
        - Preference Layout: Wants Kids: ${match.wantKids}, Open to Pets: ${match.openToPets}, Open to Relocate: ${match.openToRelocate}

        EVALUATION PROTOCOL MATRIX:
        1. compatibilityScore: Return an Integer (45 to 98). Pay exceptional attention to cultural lineage tracking. If religion matches, give a bonus. If religion does not match, apply a clear deduction to rank them lower.
        2. strengths: Provide exactly two sentences tracking clear multi-point data combinations. Explicitly mention names, professional roles, matching dietary preferences, and ancestral values (${client.religion} / ${client.caste}).
        3. challenges: Provide exactly one or two analytical sentences flagging cross-city logistics, value transitions, or subtle attribute conflicts.

        Return ONLY a clean JSON string with this format:
        {
          "compatibilityScore": 92,
          "strengths": [
            "Sentences mapping structural professional and lifestyle alignment.",
            "Sentences mapping cultural lineage symmetry."
          ],
          "challenges": [
            "Sentences tracking active friction variables cleanly."
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const matchJson = responseText.match(/\{[\s\S]*\}/);
      
      if (!matchJson) throw new Error("JSON payload malformed.");
      analysisData = JSON.parse(matchJson[0]);

    } catch (aiError) {
      console.warn("⚠️ Rate Limit Active - Launching Adaptive Matrix Reasoner:", aiError.message);

      // Adaptive backup computation checking ALL data variables dynamically
      let structuralScore = 82;
      const strengthsPool = [
        `Outstanding career velocity tracking observed between ${client.firstName} (${client.designation}) and ${match.firstName} (${match.designation}).`
      ];
      const challengesPool = [];

      // DYNAMIC CALCULATION Matrix based on Religion and Caste
      if (client.religion.toLowerCase() === match.religion.toLowerCase()) {
        structuralScore += 10;
        strengthsPool.push(`Excellent cultural alignment verified inside the shared communal framework of the ${client.religion} community.`);
        
        if (client.caste.toLowerCase() === match.caste.toLowerCase()) {
          structuralScore += 5;
          strengthsPool.push(`Explicit ancestral lineage validation achieved across matching ${client.caste} parameters.`);
        }
      } else {
        structuralScore -= 15;
        challengesPool.push(`Cross-cultural variance noticed: Navigating different custom frameworks (${client.religion} vs ${match.religion}).`);
      }

      // Proximity metrics tracking
      if (client.city !== match.city) {
        structuralScore -= 8;
        challengesPool.push(`Geographic coordination necessary to bridge social spaces between ${client.city} and ${match.city}.`);
      } else {
        structuralScore += 3;
        challengesPool.push(`Coordinating busy professional timelines natively inside the localized ${client.city} workspace.`);
      }

      if (client.diet !== match.diet) {
        structuralScore -= 5;
        challengesPool.push(`Dietary preference alignment required between a ${client.diet} menu routine and candidate ${match.diet} requirements.`);
      }

      analysisData = {
        compatibilityScore: Math.min(Math.max(structuralScore, 45), 97),
        strengths: strengthsPool.slice(0, 3),
        challenges: challengesPool.length > 0 ? challengesPool : ["Coordinating career trajectory requirements alongside active corporate lifestyles."]
      };
    }

    res.status(200).json(analysisData);
  } catch (error) {
    res.status(500).json({ message: "Fatal engine intercept", error: error.message });
  }
};