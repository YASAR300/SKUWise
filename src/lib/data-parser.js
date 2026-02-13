import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Parses a file (Buffer) based on its type and returns JSON data.
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<Array>}
 */
export async function parseFile(buffer, mimeType) {
    return new Promise((resolve, reject) => {
        try {
            if (mimeType === "text/csv") {
                const text = buffer.toString("utf8");
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (err) => reject(err),
                });
            } else if (
                mimeType === "application/vnd.ms-excel" ||
                mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) {
                const workbook = XLSX.read(buffer, { type: "buffer" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
                resolve(data);
            } else {
                reject(new Error(`Unsupported file type: ${mimeType}`));
            }
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Normalizes and maps raw JSON data to our Prisma schema.
 * @param {Array} data 
 * @param {string} type - 'product', 'review', 'sales'
 * @returns {Array}
 */
export function normalizeData(data, type) {
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
        const cleanItem = {};

        // Normalize keys to lowercase for easier mapping
        const normalizedItem = Object.keys(item).reduce((acc, key) => {
            acc[key.toLowerCase().trim().replace(/[\s_]/g, '')] = item[key];
            return acc;
        }, {});

        const cleanCurrency = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[^\d.-]/g, '')) || 0;
        };

        const cleanDate = (val) => {
            if (!val) return new Date();
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        if (type === 'product') {
            cleanItem.name = normalizedItem.name || normalizedItem.productname || normalizedItem.title || "Unknown Product";
            cleanItem.category = normalizedItem.category || normalizedItem.type || normalizedItem.department || "Uncategorized";
            cleanItem.price = cleanCurrency(normalizedItem.price || normalizedItem.mrp || normalizedItem.cost);
            cleanItem.rating = parseFloat(normalizedItem.rating || normalizedItem.stars || 0);
            cleanItem.stock = parseInt(normalizedItem.stock || normalizedItem.inventory || normalizedItem.quantity || 0);

            // Auto-correct category casing
            cleanItem.category = cleanItem.category.charAt(0) + cleanItem.category.slice(1).toLowerCase();
        }

        else if (type === 'review') {
            cleanItem.productName = normalizedItem.product || normalizedItem.productname || normalizedItem.id;
            cleanItem.rating = Math.min(5, Math.max(1, parseInt(normalizedItem.rating || normalizedItem.score || 5)));
            cleanItem.comment = normalizedItem.comment || normalizedItem.review || normalizedItem.text || "";
            cleanItem.date = cleanDate(normalizedItem.date || normalizedItem.timestamp);
        }

        else if (type === 'sales') {
            cleanItem.productName = normalizedItem.product || normalizedItem.productname || normalizedItem.sku;
            cleanItem.unitsSold = parseInt(normalizedItem.unitssold || normalizedItem.sold || normalizedItem.qty || 0);
            cleanItem.revenue = cleanCurrency(normalizedItem.revenue || normalizedItem.sales || normalizedItem.total);
            cleanItem.date = cleanDate(normalizedItem.date || normalizedItem.timestamp);
        }

        return cleanItem;
    });
}
