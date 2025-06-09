// File: /api/buildbot.js
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
  ];
  for (const category of categoriesToSummarize) {
    if (category.data && category.data.length > 0) {
      summary += `${category.name}:\n`;
      category.data.forEach((part) => {
        summary += `- ID: ${part.id}, Name: ${
          part.name
        }, Price: ${part.price.toFixed(2)}, Category: ${
          part.category
        }, ${category.keySpecs(part)}\n`;
      });
      summary += "\n";
    }
  }
  return summary;
}

// --- UPDATED, SIMPLER, AND STRICTER PROMPT FOR NEW BUILDS ---
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
2.  **COMPONENT SELECTION:** You must select exactly one of each: CPU, Motherboard, GPU, Storage, PSU, and Case from the AVAILABLE COMPONENTS list. For RAM, select exactly two identical sticks for dual-channel performance (if the motherboard has >= 2 slots).
3.  **COMPATIBILITY:** The build MUST be compatible.
    - \`cpu.specs.socket\` must match \`motherboard.specs.socket\`.
    - \`ram.specs.type\` must match \`motherboard.specs.memoryType\`.
4.  **SUBSTITUTION:** If the user requests a specific component not in the list (e.g., "RTX 3050"), find the most similar available alternative (e.g., "RTX 3060") and use that instead. Mention the substitution in your 'reply' and 'compatibilityNotes'.

**FINAL OUTPUT:**
Your entire output must be a single JSON object.

* **If a compatible build within budget is possible**, output this exact JSON shape:
    \`\`\`json
    {
      "buildName": "A descriptive name for the build",
      "reply": "A short, helpful summary of the build and your key choices.",
      "parts": [
        { "category": "cpu", "id": "...", "name": "...", "price": 0.00 },
        { "category": "motherboard", "id": "...", "name": "...", "price": 0.00 },
        { "category": "ram", "id": "...", "name": "...", "price": 0.00 },
        { "category": "ram", "id": "...", "name": "...", "price": 0.00 },
        { "category": "gpu", "id": "...", "name": "...", "price": 0.00 },
        { "category": "storage", "id": "...", "name": "...", "price": 0.00 },
        { "category": "psu", "id": "...", "name": "...", "price": 0.00 },
        { "category": "case", "id": "...", "name": "...", "price": 0.00 }
      ],
      "totalCost": 0.00,
      "compatibilityNotes": ["CPU and Motherboard sockets are compatible (LGA1700).", "RAM type (DDR5) is compatible with the motherboard."],
      "deepLink": "/build?parts=id1,id2,id3,id4,id5,id6,id7,id8"
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

// --- PROMPT 2: For UPGRADES (Unchanged from our last version) ---
const UPGRADE_SYSTEM_INSTRUCTIONS = (mockDataSummaryForPrompt) => `
You are BuildBot, an AI agent specialized in recommending **upgrades for a user's EXISTING PC**. You will be given the user's current components and upgrade budget. Base your suggestions for NEW parts **only** on the provided AVAILABLE COMPONENTS list.

================================================================================
AVAILABLE COMPONENTS (for NEW parts):
${mockDataSummaryForPrompt}
================================================================================

USER'S CURRENT SETUP AND GOALS WILL BE PROVIDED IN THEIR MESSAGE.

YOUR TASK (FOR AN UPGRADE):
1.  **Parse Input:** Identify Existing Components, Upgrade Budget (for NEW parts), and Upgrade Goals.
2.  **Plan Upgrade:** Determine which parts to KEEP (\`"status": "existing"\`) and which to UPGRADE (\`"status": "new"\`).
3.  **Select New Components:** For each part being upgraded, select a primary recommended part (\`selectedPart\`) and 1-2 alternatives (\`alternativeParts\`).
4.  **Compatibility:** All NEW parts must be compatible with KEPT EXISTING parts and other NEW parts.
5.  **Budget:** The \`totalCost\` (sum of prices for "new" parts only) MUST be ≤ user’s upgrade budget.
6.  **Output Format (Strict JSON Only):**
    {
      "reply": "string", "buildName": "string",
      "parts": [
        { "category": "gpu", "status": "new", "selectedPart": { ... }, "alternativeParts": [ ... ] },
        { "category": "cpu", "status": "existing", "selectedPart": { ... }, "alternativeParts": [] }
      ],
      "totalCost": 0.00, // Sum of "new" parts only.
      "compatibilityNotes": [ "string" ],
      "deepLink": "string"
    }
`;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", ["POST"]);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  try {
    const requestBody = request.body;
    if (typeof requestBody !== "object" || requestBody === null) {
      return response
        .status(400)
        .json({ error: "Invalid request: Body must be a JSON object." });
    }

    const {
      message: userNaturalLanguageQuery,
      requestType,
      currentUserParts,
      upgradeBudget,
    } = requestBody;

    if (requestType === "newBuild" && !userNaturalLanguageQuery) {
      return response.status(400).json({
        error: 'Invalid request: "message" is required for new builds.',
      });
    }
    if (
      requestType === "upgrade" &&
      (!currentUserParts || upgradeBudget === undefined)
    ) {
      return response.status(400).json({
        error:
          'Invalid request: "currentUserParts" and "upgradeBudget" are required for upgrades.',
      });
    }

    console.log("[api/buildbot] Request type:", requestType);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("[api/buildbot] CRITICAL: GEMINI_API_KEY missing!");
      return response
        .status(500)
        .json({ error: "AI service config error. API Key missing." });
    }

    const cpus = loadMockData("cpus.json");
    const gpus = loadMockData("gpus.json");
    const motherboards = loadMockData("motherboards.json");
    const rams = loadMockData("rams.json");
    const storages = loadMockData("storages.json");
    const psus = loadMockData("psus.json");
    const cases = loadMockData("cases.json");

    const mockDataSummary = buildMockDataSummary({
      cpus,
      gpus,
      motherboards,
      rams,
      storages,
      psus,
      cases,
    });
    const allLoadedParts = {
      cpus,
      gpus,
      motherboards,
      rams,
      storages,
      psus,
      cases,
    };

    let systemInstructionsToUse;
    let effectiveUserMessageForAI = userNaturalLanguageQuery;

    if (requestType === "upgrade") {
      systemInstructionsToUse = UPGRADE_SYSTEM_INSTRUCTIONS(mockDataSummary);

      let currentPartsDescription = Object.entries(currentUserParts)
        .map(
          ([key, value]) =>
            `${key.replace(/Id$|Ids$/, "")}: ${
              Array.isArray(value) ? value.join(", ") : value
            }`
        )
        .join("\n");

      effectiveUserMessageForAI = `
        INPUT (for an UPGRADE):
        Existing components: ${currentPartsDescription}
        Upgrade budget: $${upgradeBudget}
        Goal: "${userNaturalLanguageQuery}"
      `;
    } else {
      // *** FIXED: Use the new, more robust regex to parse the budget ***
      const budgetMatch = userNaturalLanguageQuery.match(
        /(?:for|under|budget|less than|around)\s*\$?(\d+)/i
      );
      const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 1200;
      console.log(
        `[api/buildbot] Parsed budget for new build: $${parsedBudget}`
      );

      systemInstructionsToUse = NEW_BUILD_SYSTEM_INSTRUCTIONS(
        mockDataSummary,
        parsedBudget
      );
      effectiveUserMessageForAI = `USER REQUEST: "${userNaturalLanguageQuery}"`;
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
    console.log("[api/buildbot] Received raw AI response:", rawAiResponseText);

    let aiJsonOutput;
    try {
      const jsonMatch = rawAiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStringToParse = jsonMatch
        ? jsonMatch[1].trim()
        : rawAiResponseText.trim();
      aiJsonOutput = JSON.parse(jsonStringToParse);
    } catch (error) {
      return response.status(500).json({
        reply: `AI response was not valid JSON. Raw: ${rawAiResponseText.substring(
          0,
          200
        )}`,
      });
    }

    // UPDATED: Handle the new "error" key for budget failures
    if (aiJsonOutput.error) {
      console.log(
        "[api/buildbot] AI returned a structured error:",
        aiJsonOutput
      );
      return response.status(400).json({
        reply: `I'm sorry, I couldn't complete the request. Reason: ${
          aiJsonOutput.error
        }. Your budget was $${
          aiJsonOutput.budget || aiJsonOutput.requestedBudget
        }, but the minimum cost for a compatible build was $${
          aiJsonOutput.minimumRequired
        }.`,
        buildName: "Request Error",
        ...aiJsonOutput,
      });
    }

    if (!aiJsonOutput.reply || !aiJsonOutput.parts) {
      return response
        .status(500)
        .json({ reply: "AI response missing critical fields." });
    }

    const validatedPartsOutput = [];
    let calculatedCost = 0;
    const deepLinkPartIds = [];

    for (const item of aiJsonOutput.parts) {
      const partToValidate = item.selectedPart || item;
      if (!partToValidate?.id || !partToValidate.category) {
        continue;
      }

      const { id, category } = partToValidate;
      const status = item.status || "new";

      const categoryKeyForLookup = category.toLowerCase().endsWith("s")
        ? category.toLowerCase()
        : `${category.toLowerCase()}s`;
      const categoryData =
        allLoadedParts[categoryKeyForLookup] ||
        allLoadedParts[category.toLowerCase()];
      const foundPart = categoryData?.find((p) => p.id === id);

      if (!foundPart) {
        console.warn(`AI part ID ${id} not found.`);
        continue;
      }

      const finalSelectedPart = {
        id: foundPart.id,
        name: foundPart.name,
        price: Number(foundPart.price),
        category: foundPart.category,
      };
      if (status === "new") {
        calculatedCost += finalSelectedPart.price;
      }
      deepLinkPartIds.push(finalSelectedPart.id);

      const validatedAlternativeParts = [];
      if (status === "new" && Array.isArray(item.alternativeParts)) {
        item.alternativeParts.forEach((altPart) => {
          const altCategoryData =
            allLoadedParts[`${altPart.category?.toLowerCase()}s`] ||
            allLoadedParts[altPart.category?.toLowerCase()];
          const foundAlt = altCategoryData?.find((p) => p.id === altPart.id);
          if (foundAlt)
            validatedAlternativeParts.push({
              id: foundAlt.id,
              name: foundAlt.name,
              price: Number(foundAlt.price),
              category: foundAlt.category,
            });
        });
      }

      validatedPartsOutput.push({
        category: item.category || finalSelectedPart.category,
        status: status,
        selectedPart: finalSelectedPart,
        alternativeParts: validatedAlternativeParts,
      });
    }

    const finalTotalCostForResponse =
      requestType === "upgrade" ? calculatedCost : aiJsonOutput.totalCost;

    const finalResponseToFrontend = {
      reply: aiJsonOutput.reply,
      buildName: aiJsonOutput.buildName || "AI Suggestion",
      parts: validatedPartsOutput,
      totalCost: parseFloat(finalTotalCostForResponse.toFixed(2)),
      compatibilityNotes: aiJsonOutput.compatibilityNotes || [],
      deepLink:
        deepLinkPartIds.length > 0
          ? `/build?parts=${deepLinkPartIds.join(",")}`
          : "",
      requestType: requestType,
    };

    return response.status(200).json(finalResponseToFrontend);
  } catch (error) {
    console.error("[api/buildbot] Catastrophic error in handler:", error);
    return response
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
