import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";

function loadMockData(filename) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", filename);
    if (!fs.existsSync(filePath)) {
      console.error(`[api/buildbot] Mock data file NOT FOUND: ${filePath}`);
      return [];
    }
    const jsonData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(
      `[api/buildbot] Error loading mock data file ${filename}:`,
      error
    );
    return [];
  }
}

function buildMockDataSummary(allPartsCollections) {
  let summary = "";
  const categoriesToSummarize = [
    // ... (your other categories like CPUs, GPUs are fine) ...
    {
      name: "CPUs",
      data: allPartsCollections.cpus,
      keySpecs: (p) => `Socket: ${p.specs.socket}, Cores: ${p.specs.cores}`,
    },
    {
      name: "GPUs",
      data: allPartsCollections.gpus,
      keySpecs: (p) => `Memory: ${p.specs.memory}`,
    },
    {
      name: "Motherboards",
      data: allPartsCollections.motherboards,
      keySpecs: (p) =>
        `Socket: ${p.specs.socket}, Memory Type: ${p.specs.memoryType}, Memory Slots: ${p.specs.memorySlots}`,
    },
    {
      name: "RAMs",
      data: allPartsCollections.rams,
      keySpecs: (p) =>
        `Capacity: ${p.specs.capacity} (per stick), Type: ${p.specs.type}, Speed: ${p.specs.speed}`,
    },
    {
      name: "Storage",
      data: allPartsCollections.storages,
      keySpecs: (p) => `Type: ${p.specs.type}, Capacity: ${p.specs.capacity}`,
    },
    {
      name: "PSUs",
      data: allPartsCollections.psus,
      keySpecs: (p) => `Wattage: ${p.specs.wattage}`,
    },
    {
      name: "Cases",
      data: allPartsCollections.cases,
      keySpecs: (p) => `Type: ${p.specs.type}`,
    },
    {
      // The fully corrected object for Coolers
      name: "Coolers",
      data: allPartsCollections.coolers,
      keySpecs: (p) => {
        if (p.type === "AIO Liquid Cooler") {
          return `Type: AIO, Radiator: ${p.specs.radiator_size}`;
        }
        return `Type: Air, Fan Size: ${p.specs.fan_size}`;
      },
    },
  ];
  for (const category of categoriesToSummarize) {
    if (category.data && category.data.length > 0) {
      summary += `${category.name}:\n`;
      category.data.forEach((part) => {
        // Corrected to use category.name instead of the non-existent part.category
        summary += `- ID: ${part.id}, Name: ${
          part.name
        }, Price: ${part.price.toFixed(2)}, Category: ${
          category.name
        }, ${category.keySpecs(part)}\n`;
      });
      summary += "\n";
    }
  }
  return summary;
}

// --- PROMPT 1: FOR NEW BUILDS (Restored) ---
const NEW_BUILD_SYSTEM_INSTRUCTIONS = (mockDataSummary, budget) => `
You are BuildBot, an expert AI that assembles complete PC builds. Your ONLY goal is to analyze a user's request and respond with a single, valid JSON object. Do not output any other text, greetings, or explanations outside of the JSON structure.

================================================================================
AVAILABLE COMPONENTS:
${mockDataSummary}
================================================================================

**RULES:**
1.  **BUDGET:** You will be given a hard budget limit of **$${budget.toFixed(
  2
)}**. The 'totalCost' of all selected parts MUST NOT exceed this number.
2.  **COMPONENT SELECTION:** You must select exactly one of each: CPU, Motherboard, GPU, Storage, Cooler, PSU, and Case from the AVAILABLE COMPONENTS list. For RAM, select exactly two identical sticks for dual-channel performance (if the motherboard has >= 2 slots).
3.  **COMPATIBILITY:** The build MUST be compatible. \`cpu.specs.socket\` must match \`motherboard.specs.socket\`. \`ram.specs.type\` must match \`motherboard.specs.memoryType\`.
4.  **SUBSTITUTION:** If the user requests a specific component not in the list (e.g., "RTX 3050"), find the most similar available alternative (e.g., "RTX 3060") and use that instead. Mention the substitution in your 'reply' and 'compatibilityNotes'.

**FINAL OUTPUT:**
Your entire output must be a single JSON object.

* **If a compatible build within budget is possible**, output this exact JSON shape:
    \`\`\`json
    {
      "buildName": "A descriptive name for the build",
      "reply": "A short, helpful summary of the build and your key choices.",
      "parts": [
        { "category": "cpu", "id": "cpu-001", "name": "Intel Core i5-13600K", "price": 317.99 },
        { "category": "motherboard", "id": "mobo-001", "name": "ASUS ROG Strix Z790-E Gaming WiFi II", "price": 499.99 },
        { "category": "ram", "id": "ram-stick-001", "name": "Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz", "price": 99.99 },
        { "category": "ram", "id": "ram-stick-001", "name": "Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz", "price": 99.99 },
        { "category": "gpu", "id": "gpu-001", "name": "NVIDIA GeForce RTX 4090 Founders Edition", "price": 1599.00 },
        { "category": "storage", "id": "stor-001", "name": "Samsung 980 Pro 1TB NVMe M.2 SSD", "price": 99.99 },
        { "category": "psu", "id": "psu-001", "name": "Corsair RM750x (2021) 750W 80+ Gold Fully Modular PSU", "price": 109.99 },
        { "category": "case", "id": "case-001", "name": "Lian Li Lancool II Mesh Type C", "price": 109.99 }
      ],
      "totalCost": 2936.93,
      "compatibilityNotes": ["CPU and Motherboard sockets are compatible (LGA1700).", "RAM type (DDR5) is compatible with the motherboard."],
      "deepLink": "/build?parts=cpu-001,mobo-001,ram-stick-001,ram-stick-001,gpu-001,stor-001,psu-001,case-001"
    }
    \`\`\`

* **If you CANNOT create a build** that meets all compatibility and budget rules, output this exact JSON shape:
    \`\`\`json
    {
      "error": "Budget Exceeded",
      "budget": ${budget},
      "minimumRequired": "<the total price of the cheapest compatible build you could find>"
    }
    \`\`\`
`;

// --- PROMPT 2: YOUR NEW PROMPT FOR UPGRADES ---
const UPGRADE_SYSTEM_INSTRUCTIONS = (mockDataSummary, upgradeBudget) => `
You are BuildBot, an expert PC upgrade AI. Your task is to recommend hardware upgrades for a user's existing PC, based on the provided available components list and a strict budget.

======================
AVAILABLE COMPONENTS:
${mockDataSummary}
======================

**INSTRUCTIONS:**
- Recommend a prioritized list of upgrades for the user's PC, not one per category, but as many as are most impactful within their upgrade budget. (e.g., for gaming, prefer GPU, then CPU, then RAM, etc.)
- Only include a category in the priority list if the upgrade is both compatible and affordable.
- For each category, output:
  - "priorityUpgrade": the single best upgrade within budget (or null if not possible)
  - "alternatives": up to 3 other compatible upgrades for that category, with better performance but higher cost, even if over budget (these are "step-up" options)
- "priorityUpgrade" objects together MUST NOT exceed the budget in total.
- Do NOT include sidegrades, downgrades, or incompatible parts.
- Output in this JSON structure:
\`\`\`json
{
  "buildName": "Short helpful build name",
  "reply": "Your summary reply for the user",
  "priorityUpgrades": [
    { "id": "gpu-005", "name": "Nvidia RTX 4070", "price": 550.00, "category": "gpu" }
  ],
  "alternatives": {
    "gpu": [{ "id": "gpu-006", "name": "Nvidia RTX 4070 Ti", "price": 799.00 }],
    "cpu": [{ "id": "cpu-002", "name": "Intel Core i7-13700K", "price": 409.00 }]
  },
  "compatibilityNotes": [ "New GPU is compatible with your existing motherboard and PSU." ]
}
\`\`\`
`;

// ------- HANDLER ---------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const requestBody = req.body;
    const {
      message: userNaturalLanguageQuery,
      requestType,
      currentUserParts,
      upgradeBudget,
    } = requestBody;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY)
      return res
        .status(500)
        .json({ error: "AI service config error. API Key missing." });

    const allLoadedParts = {
      cpus: loadMockData("cpus.json"),
      gpus: loadMockData("gpus.json"),
      motherboards: loadMockData("motherboards.json"),
      rams: loadMockData("rams.json"),
      storages: loadMockData("storages.json"),
      psus: loadMockData("psus.json"),
      cases: loadMockData("cases.json"),
      coolers: loadMockData("coolers.json"),
    };
    const mockDataSummary = buildMockDataSummary(allLoadedParts);

    let systemInstructionsToUse, effectiveUserMessageForAI;

    if (requestType === "upgrade") {
      if (
        upgradeBudget == null ||
        typeof upgradeBudget !== "number" ||
        upgradeBudget <= 0
      )
        return res.status(400).json({
          error: "Invalid Budget",
          reply: "A valid, positive number is required for the upgrade budget.",
        });
      if (
        currentUserParts == null ||
        typeof currentUserParts !== "object" ||
        Object.keys(currentUserParts).length === 0
      )
        return res.status(400).json({
          error: "Missing Components",
          reply: "Your current PC parts are required to suggest an upgrade.",
        });

      systemInstructionsToUse = UPGRADE_SYSTEM_INSTRUCTIONS(
        mockDataSummary,
        upgradeBudget
      );
      const currentPartsDescription = Object.entries(currentUserParts)
        .map(
          ([key, value]) =>
            `${key.replace(/Id$|Ids$/, "")}: ${
              Array.isArray(value) ? value.join(", ") : value
            }`
        )
        .join("\n");
      effectiveUserMessageForAI = `INPUT (for an UPGRADE):\nExisting components: ${currentPartsDescription}\nUpgrade budget: $${upgradeBudget}\nGoal: "${userNaturalLanguageQuery}"`;
    } else if (requestType === "newBuild") {
      const budgetMatch = userNaturalLanguageQuery.match(
        /(?:for|under|budget|less than|around)\s*\$?(\d+)/i
      );
      const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 1500;
      systemInstructionsToUse = NEW_BUILD_SYSTEM_INSTRUCTIONS(
        mockDataSummary,
        parsedBudget
      );
      effectiveUserMessageForAI = `USER REQUEST: "${userNaturalLanguageQuery}"`;
    } else {
      return res
        .status(400)
        .json({ error: `Unsupported requestType: '${requestType}'` });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemInstructionsToUse }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will follow all instructions and output only valid JSON.",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(effectiveUserMessageForAI);
    const rawAiResponseText = result.response.text();
    console.log("[/api/buildbot] AI RAW RESPONSE:", rawAiResponseText);

    let aiJsonOutput;
    try {
      const jsonMatch = rawAiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
      aiJsonOutput = JSON.parse(
        jsonMatch ? jsonMatch[1].trim() : rawAiResponseText.trim()
      );
    } catch (error) {
      return res.status(500).json({
        error: "AI output was not valid JSON",
        raw: rawAiResponseText.substring(0, 200),
      });
    }

    if (aiJsonOutput.error)
      return res
        .status(400)
        .json({ buildName: "Request Error", ...aiJsonOutput });
    if (!aiJsonOutput.reply)
      return res
        .status(500)
        .json({ error: "AI response missing 'reply' field." });

    if (requestType === "upgrade") {
      if (!aiJsonOutput.priorityUpgrades || !aiJsonOutput.alternatives) {
        return res.status(500).json({
          error:
            "AI response missing 'priorityUpgrades' or 'alternatives' field.",
        });
      }
      const totalCost = (aiJsonOutput.priorityUpgrades || []).reduce(
        (sum, part) => sum + Number(part.price || 0),
        0
      );
      const normAlternatives = {};
      Object.entries(aiJsonOutput.alternatives || {}).forEach(([k, v]) => {
        normAlternatives[k.toLowerCase()] = Array.isArray(v) ? v : [];
      });
      return res.status(200).json({
        buildName: aiJsonOutput.buildName,
        reply: aiJsonOutput.reply,
        priorityUpgrades: aiJsonOutput.priorityUpgrades || [],
        alternatives: normAlternatives,
        totalCost,
        compatibilityNotes: aiJsonOutput.compatibilityNotes || [],
      });
    } else {
      // 'newBuild'
      if (!aiJsonOutput.parts)
        return res
          .status(500)
          .json({ error: "AI response missing 'parts' field." });
      // Here you can add the validation loop for new build parts if you wish
      return res.status(200).json(aiJsonOutput);
    }
  } catch (error) {
    console.error("[api/buildbot] Catastrophic error in handler:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
