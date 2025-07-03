/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {initializeApp, getApps} = require("firebase-admin/app");
const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");
const vision = require("@google-cloud/vision");
const {GoogleGenAI} = require("@google/genai");

const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();
// Function to retrieve Vision service account from Secret Manager

const secretManagerClient = new SecretManagerServiceClient();

async function getVisionCredentials() {
  try {
    const [version] = await secretManagerClient.accessSecretVersion({
      name: "projects/385152816671/secrets/vision-service-account/versions/1",
    });
    return JSON.parse(version.payload.data.toString());
  } catch (error) {
    logger.error("Failed to retrieve Vision credentials:", error.message);
    throw error;
  }
}

// Initialize Vision API client dynamically
async function initializeVisionClient() {
  const credentials = await getVisionCredentials();
  return new vision.ImageAnnotatorClient({credentials});
}

exports.processReceipt = onObjectFinalized(
    {
      bucket: "bills-2dd5f.firebasestorage.app", // Replace with your Firebase Storage bucket
      secrets: ["vision-service-account"], // Declare secret dependency
      cpu: 1, // Default CPU allocation
      memory: "512MiB", // Sufficient for image processing
      timeoutSeconds: 120, // Allow up to 2 minutes for Vision and Gemini calls
    },
    async (event) => {
      const fileBucket = event.data.bucket;
      const filePath = event.data.name;
      const contentType = event.data.contentType;

      // Exit if not an image
      if (!contentType.startsWith("image/")) {
        logger.info(`File ${filePath} is not an image.`);
        return null;
      }

      // Download file
      const bucket = getStorage().bucket(fileBucket);
      const [imageBuffer] = await bucket.file(filePath).download();
      logger.info(`Image downloaded: ${filePath}`);

      try {
      // Initialize Vision API client
        const client = await initializeVisionClient();

        // Perform text detection
        const [result] = await client.documentTextDetection(imageBuffer);
        const fullText = result.fullTextAnnotation.text || "";
        if (!fullText) {
          throw new Error("No text detected in image");
        }
        logger.info(`Text extracted from image: ${fullText}`);

        // Prepare prompt for Gemini AI
        const prompt = `
          You are a highly accurate and meticulous receipt parsing AI. Your primary goal is to transform raw OCR-extracted receipt text into a structured JSON object, strictly adhering to the specified schema.

          **Instructions & Schema:**

          Extract the following fields into a JSON object. If a field's value cannot be confidently extracted, use null for numeric types or an empty string/array as appropriate.

          1.  **store_name** (string): The official name of the retail establishment (e.g., "DOLLAR TREE", "Walmart", "Safeway"). Prioritize distinct branding over generic terms.
          2.  **location** (string): The full address of the store, including street, city, state, and zip code (e.g., "588 E. El Camino Real Sunnyvale CA 94087-1940"). Concatenate all available address components.
          3.  **date** (string): The date of the purchase, formatted strictly as "YYYY-MM-DD". If multiple dates are present, choose the most prominent one.
          4.  **subtotal** (float): The total cost of items before tax. Round to two decimal places. Use null if not found.
          5.  **tax** (float): The sales tax amount applied. Round to two decimal places. Use null if not found.
          6.  **total** (float): The grand total amount paid for the receipt. This field is mandatory; if it cannot be extracted, flag it as a critical parsing failure (by using null and expecting an error upstream). Round to two decimal places.

          7.  **items** (array of objects): A list of individual products, services, or financial adjustments (like discounts or bag fees) purchased or applied. Each item object MUST have the following structure:
              * **description** (string): The exact product or transaction description as it appears on the receipt. Handle abbreviations or truncated names as seen.
              * **general_name** (string): A normalized, standardized, and human-readable name for the product or transaction type.
                  * For actual products (e.g., "GARLIC LOOSE"), map to a consistent term (e.g., "garlic").
                  * For discounts, use "discount".
                  * For bag fees, use "bag fee".
                  * Use common sense to group similar items/transactions.
              * **qty** (integer): The quantity of the item. Default to 1 if no explicit quantity is found.
              * **unit_price** (float): The price per single unit of the item *before* any line-item discounts are applied (if such a pre-discount unit price is discernible). If not directly listed but total price and qty are available, infer it (price / qty). Round to two decimal places. Use null if indeterminable or not applicable (e.g., for general "Discount" line items).
              * **price** (float): The total price for this specific line item *as it appears on the receipt*, including any line-item discounts already applied to it. For "Discount" line items, this value will typically be negative. Round to two decimal places.
              * **tags** (array of strings): Categorize the item with one or more relevant, lowercase tags. Prioritize the most specific and widely accepted tags.
                  * **Common Tags:**
                      * groceries: Food items, produce, dairy, pantry staples, beverages.
                      * produce: Fruits and vegetables (often used in conjunction with groceries).
                      * dairy: Milk, cheese, yogurt (often used in conjunction with groceries).
                      * pantry: Canned goods, dry pasta, spices, oils (often with groceries).
                      * household: Cleaning supplies, paper goods, home decor, kitchenware, general home maintenance.
                      * personal_care: Toiletries, cosmetics, hygiene products, over-the-counter medication.
                      * apparel: Clothing, shoes, accessories.
                      * electronics: Gadgets, batteries, cables.
                      * entertainment: Books, movies, games.
                      * pharmacy: Prescription or specialized health items.
                      * automotive: Car-related items.
                      * pet_supplies: Pet food, toys, accessories.
                      * other: For items that don't fit well into other categories.
                      * discount: Specifically for discount line items.
                      * fee: Specifically for fees (e.g., bag fee).

          **Format Rules:**

          * All currency values (subtotal, tax, total, unit_price, price) must be represented as float (e.g., 27.60, 2.17), without any currency symbols or commas.
          * If a numeric field cannot be reliably extracted, its value must be null.
          * The final response MUST be a valid JSON object ONLY. Do not include any conversational text, explanations, or Markdown formatting outside of the JSON structure itself.

          **Receipt Text for Parsing:**
          ---
          ${fullText}
          ---
        `;

        // Initialize Gemini AI
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Gemini API key not configured");
        }

        const ai = new GoogleGenAI({apiKey: apiKey});

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        logger.info(`Response: ${response.text}`);

        // Parse response
        let parsedData;
        try {
          parsedData = JSON.parse(response.text);
        } catch (error) {
          throw new Error(`Failed to parse Gemini response: ${error.message}`);
        }

        // Validate parsed data
        if (!parsedData.store_name || !parsedData.date || !parsedData.total) {
          throw new Error("Missing required receipt fields");
        }

        // Store in Firestore
        const receiptData = {
          ...parsedData,
          created_at: new Date().toISOString(),
          image_path: filePath,
        };
        await db.collection("receipts").add(receiptData);
        logger.info(`Receipt stored: ${filePath}`);

        // Delete the image to save storage
        await bucket.file(filePath).delete();
        logger.info(`Image deleted: ${filePath}`);

        return null;
      } catch (error) {
        logger.error(`Error processing receipt ${filePath}: ${error.message}`);
        // Store error in Firestore for debugging
        await db.collection("errors").add({
          file_path: filePath,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return null;
      }
    },
);
