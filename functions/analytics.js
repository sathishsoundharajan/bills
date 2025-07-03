/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {onCall} = require("firebase-functions/v2/https");
const {getFirestore} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");

const db = getFirestore();

exports.getReceiptAnalytics = onCall(
    {
      cors: true,
    },
    async (request) => {
      try {
        logger.info("Fetching receipt analytics");

        // Get all receipts
        const receiptsSnapshot = await db.collection("receipts").get();
        const receipts = receiptsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (receipts.length === 0) {
          return {
            totalReceipts: 0,
            totalSpent: 0,
            topItems: [],
            topCategories: [],
            monthlySpending: [],
          };
        }

        // Calculate total receipts and total spent
        const totalReceipts = receipts.length;
        const totalSpent = receipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);

        // Calculate top items
        const itemCounts = {};
        receipts.forEach((receipt) => {
          if (receipt.items && Array.isArray(receipt.items)) {
            receipt.items.forEach((item) => {
              const name = item.general_name || item.description || "Unknown";
              const qty = item.qty || 1;
              
              if (itemCounts[name]) {
                itemCounts[name] += qty;
              } else {
                itemCounts[name] = qty;
              }
            });
          }
        });

        const topItems = Object.entries(itemCounts)
            .map(([name, quantity]) => ({name, quantity}))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Calculate top categories
        const categoryTotals = {};
        receipts.forEach((receipt) => {
          if (receipt.items && Array.isArray(receipt.items)) {
            receipt.items.forEach((item) => {
              const tags = item.tags || ["other"];
              const price = item.price || 0;
              
              tags.forEach((tag) => {
                if (categoryTotals[tag]) {
                  categoryTotals[tag] += price;
                } else {
                  categoryTotals[tag] = price;
                }
              });
            });
          }
        });

        const topCategories = Object.entries(categoryTotals)
            .map(([name, total]) => ({name, total}))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Calculate monthly spending
        const monthlyTotals = {};
        receipts.forEach((receipt) => {
          if (receipt.date) {
            const date = new Date(receipt.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            
            if (monthlyTotals[monthKey]) {
              monthlyTotals[monthKey] += receipt.total || 0;
            } else {
              monthlyTotals[monthKey] = receipt.total || 0;
            }
          }
        });

        const monthlySpending = Object.entries(monthlyTotals)
            .map(([month, total]) => ({month, total}))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Last 12 months

        const analytics = {
          totalReceipts,
          totalSpent,
          topItems,
          topCategories,
          monthlySpending,
        };

        logger.info("Analytics calculated successfully", {
          totalReceipts,
          totalSpent,
          topItemsCount: topItems.length,
          topCategoriesCount: topCategories.length,
          monthlyDataPoints: monthlySpending.length,
        });

        return analytics;
      } catch (error) {
        logger.error("Error calculating analytics:", error);
        throw new Error("Failed to calculate analytics");
      }
    },
);