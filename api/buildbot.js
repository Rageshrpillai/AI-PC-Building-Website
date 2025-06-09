// File: /api/buildbot.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";

function loadMockData(filename) {
  // This function remains the same
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
  // This helper function remains the same
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
      keySpecs: (p) =>
        `Memory: ${p.specs.memory}, TDP: ${p.specs.tdp || "N/A"}`,
    },
    {
      name: "Motherboards",
      data: allPartsCollections.motherboards,
      keySpecs: (p) =>
        `Socket: ${p.specs.socket}, Form Factor: ${p.specs.formFactor}, Memory Type: ${p.specs.memoryType}, Memory Slots: ${p.specs.memorySlots}`,
    },
    {
      name: "RAMs",
      data: allPartsCollections.rams,
      keySpecs: (p) =>
        `Capacity: ${p.specs.capacity} (per stick), Type: ${
          p.specs.type
        }, Speed: ${p.specs.speed}, Sticks: ${p.specs.sticksInKit || 1}`,
    },
    {
      name: "Storage",
      data: allPartsCollections.storages,
      keySpecs: (p) =>
        `Type: ${p.specs.type}, Capacity: ${p.specs.capacity}, Read Speed: ${
          p.specs.readSpeed || "N/A"
        }`,
    },
    {
      name: "PSUs",
      data: allPartsCollections.psus,
      keySpecs: (p) =>
        `Wattage: ${p.specs.wattage}, Efficiency: ${p.specs.efficiencyRating}`,
    },
    {
      name: "Cases",
      data: allPartsCollections.cases,
      keySpecs: (p) =>
        `Type: ${p.specs.type}, Max GPU Length: ${
          p.specs.maxGPULength || "N/A"
        }`,
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

// --- UPDATED PROMPT 1: Your New, Stricter Prompt for New Builds ---
const NEW_BUILD_SYSTEM_INSTRUCTIONS = (mockDataSummary, budget) => `
You are BuildBot, an expert at assembling **complete** PC builds **under a strict budget**.
**MAX BUDGET: $${budget.toFixed(2)}**
You may use **only** the components listed below, and under **no circumstances** may your total exceed $${budget.toFixed(
  2
)}.
**Always** output **one** single, valid JSON object—no Markdown, no extra commentary, no omissions.

================================================================================
**AVAILABLE COMPONENTS:**
${mockDataSummary}
================================================================================

**USER REQUEST:**
“<the user’s natural-language request>”

**RULES (build must follow ALL of these):**
1. **Budget Enforcement**
   - The sum of all part prices **must** be ≤ $${budget.toFixed(2)}.
   - If you cannot find a valid combination ≤ $${budget.toFixed(
     2
   )}, return exactly:
     \`\`\`json
     {
       "error": "Budget Exceeded",
       "requestedBudget": ${budget},
       "minimumRequired": <the smallest total you could not beat>
     }
     \`\`\`
2. **Parts Required**
   - 1× CPU
   - 1× Motherboard
   - 1× GPU
   - 1× Storage
   - 1× PSU
   - 1× Case
   - RAM: if motherboard has ≥2 slots, pick exactly 2 identical sticks; never exceed slot count.
3. **Compatibility** (all must pass):
   - CPU socket ↔ Motherboard socket
   - RAM type ↔ Motherboard memoryType
   - Motherboard form factor ↔ Case form factor
4. **Output**
   - **One** single, valid JSON object—no Markdown, no commentary, no extra fields.
   - Shape must be exactly:
     \`\`\`json
     {
       "buildName": "string",
       "reply": "string",
       "parts": [
         { "category":"cpu", "id":"…", "name":"…", "price":0.00 },
         …other parts…
       ],
       "totalCost": 0.00,
       "compatibilityNotes": [ "note1", … ],
       "deepLink": "/build?parts=ID1,ID2,…"
     }
     \`\`\`
`;

// --- PROMPT 2: For UPGRADES (Unchanged from before) ---
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
      "deepLink": "string" // Includes IDs of ALL selectedParts (existing and new).
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
      return response
        .status(400)
        .json({
          error: 'Invalid request: "message" is required for new builds.',
        });
    }
    if (
      requestType === "upgrade" &&
      (!currentUserParts || upgradeBudget === undefined)
    ) {
      return response
        .status(400)
        .json({
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
        Upgrade goals: "${userNaturalLanguageQuery}"
      `;
    } else {
      // Default to new build
      // Parse budget from user query or use default, as per the new prompt's rules
      const budgetMatch = userNaturalLanguageQuery.match(/\$?(\d{3,})/);
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
      return response
        .status(500)
        .json({
          reply: `AI response was not valid JSON. Raw: ${rawAiResponseText.substring(
            0,
            200
          )}`,
        });
    }

    // UPDATED: Handle the new "error" key for budget failures from both prompts
    if (aiJsonOutput.error) {
      console.log(
        "[api/buildbot] AI returned a structured error message:",
        aiJsonOutput.error
      );
      return response.status(400).json({
        // Create a user-friendly reply from the AI's error object
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

    // This validation logic is now more flexible and handles both prompt outputs
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

      // For upgrades, cost is only new parts. For new builds, all parts are new.
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
