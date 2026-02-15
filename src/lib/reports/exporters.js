// Report Exporters - PDF, CSV, Excel
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";

/**
 * Export report to PDF
 */
export function exportToPDF(reportData) {
    const doc = new jsPDF();
    const { type, summary, data, insights, generatedAt } = reportData;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text(`${type.toUpperCase()} REPORT`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 14, 28);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Summary", 14, 40);

    let yPos = 48;
    Object.entries(summary).forEach(([key, value]) => {
        doc.setFontSize(10);
        doc.text(`${formatKey(key)}: ${formatValue(value)}`, 14, yPos);
        yPos += 6;
    });

    // Insights Section
    if (insights && insights.length > 0) {
        yPos += 10;
        doc.setFontSize(14);
        doc.text("Key Insights", 14, yPos);
        yPos += 8;

        insights.forEach(insight => {
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(insight, 180);
            doc.text(lines, 14, yPos);
            yPos += lines.length * 6;
        });
    }

    // Data Table
    if (type === "inventory" && data.allProducts) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Product Details", 14, 20);

        const tableData = data.allProducts.slice(0, 50).map(p => [
            p.sku,
            p.name,
            p.category || "N/A",
            p.stock,
            `$${p.price.toFixed(2)}`,
            `$${p.cost.toFixed(2)}`,
        ]);

        doc.autoTable({
            startY: 28,
            head: [["SKU", "Name", "Category", "Stock", "Price", "Cost"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [79, 70, 229] },
        });
    }

    if (type === "margin" && data.allProducts) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Margin Analysis", 14, 20);

        const tableData = data.allProducts.slice(0, 50).map(p => [
            p.sku,
            p.name,
            `$${p.price.toFixed(2)}`,
            `$${p.cost.toFixed(2)}`,
            `${p.marginPercent.toFixed(1)}%`,
            `$${p.totalProfit.toFixed(2)}`,
        ]);

        doc.autoTable({
            startY: 28,
            head: [["SKU", "Name", "Price", "Cost", "Margin %", "Total Profit"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [79, 70, 229] },
        });
    }

    return doc;
}

/**
 * Export report to CSV
 */
export function exportToCSV(reportData) {
    const { type, data } = reportData;

    let csvData = [];

    if (type === "inventory" && data.allProducts) {
        csvData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Category: p.category || "N/A",
            Brand: p.brand || "N/A",
            Stock: p.stock,
            Price: p.price,
            Cost: p.cost,
            ReorderPoint: p.reorderPoint || "N/A",
        }));
    } else if (type === "margin" && data.allProducts) {
        csvData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Price: p.price,
            Cost: p.cost,
            Margin: p.margin,
            "Margin %": p.marginPercent.toFixed(2),
            "Total Revenue": p.totalRevenue,
            "Total Profit": p.totalProfit,
        }));
    } else if (type === "sales" && data.allProducts) {
        csvData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Price: p.price,
            Stock: p.stock,
            Revenue: p.revenue,
            Profit: p.profit,
        }));
    } else if (type === "competitive" && data.categoryAnalysis) {
        csvData = data.categoryAnalysis.map(c => ({
            Category: c.category,
            "Product Count": c.productCount,
            "Avg Price": c.avgPrice.toFixed(2),
            "Avg Cost": c.avgCost.toFixed(2),
            "Avg Margin %": c.avgMargin.toFixed(2),
            "Min Price": c.priceRange.min,
            "Max Price": c.priceRange.max,
        }));
    }

    const csv = Papa.unparse(csvData);
    return csv;
}

/**
 * Export report to Excel
 */
export function exportToExcel(reportData) {
    const { type, summary, data, insights } = reportData;

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = Object.entries(summary).map(([key, value]) => ({
        Metric: formatKey(key),
        Value: formatValue(value),
    }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Insights Sheet
    if (insights && insights.length > 0) {
        const insightsData = insights.map((insight, i) => ({
            "#": i + 1,
            Insight: insight,
        }));
        const insightsSheet = XLSX.utils.json_to_sheet(insightsData);
        XLSX.utils.book_append_sheet(workbook, insightsSheet, "Insights");
    }

    // Data Sheet
    if (type === "inventory" && data.allProducts) {
        const productsData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Category: p.category || "N/A",
            Brand: p.brand || "N/A",
            Stock: p.stock,
            Price: p.price,
            Cost: p.cost,
            "Reorder Point": p.reorderPoint || "N/A",
        }));
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
    } else if (type === "margin" && data.allProducts) {
        const marginData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Price: p.price,
            Cost: p.cost,
            Margin: p.margin,
            "Margin %": parseFloat(p.marginPercent.toFixed(2)),
            "Total Revenue": p.totalRevenue,
            "Total Profit": p.totalProfit,
        }));
        const marginSheet = XLSX.utils.json_to_sheet(marginData);
        XLSX.utils.book_append_sheet(workbook, marginSheet, "Margin Analysis");
    } else if (type === "sales" && data.allProducts) {
        const salesData = data.allProducts.map(p => ({
            SKU: p.sku,
            Name: p.name,
            Price: p.price,
            Stock: p.stock,
            Revenue: p.revenue,
            Profit: p.profit,
        }));
        const salesSheet = XLSX.utils.json_to_sheet(salesData);
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales Data");
    } else if (type === "competitive" && data.categoryAnalysis) {
        const compData = data.categoryAnalysis.map(c => ({
            Category: c.category,
            "Product Count": c.productCount,
            "Avg Price": parseFloat(c.avgPrice.toFixed(2)),
            "Avg Cost": parseFloat(c.avgCost.toFixed(2)),
            "Avg Margin %": parseFloat(c.avgMargin.toFixed(2)),
            "Min Price": c.priceRange.min,
            "Max Price": c.priceRange.max,
        }));
        const compSheet = XLSX.utils.json_to_sheet(compData);
        XLSX.utils.book_append_sheet(workbook, compSheet, "Category Analysis");
    }

    return workbook;
}

// Helper functions
function formatKey(key) {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatValue(value) {
    if (typeof value === "number") {
        if (value > 1000) {
            return value.toLocaleString();
        }
        return value.toFixed(2);
    }
    return value;
}
