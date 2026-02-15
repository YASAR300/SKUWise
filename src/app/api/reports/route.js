import { NextResponse } from "next/server";
import {
    generateInventoryReport,
    generateMarginReport,
    generateSalesReport,
    generateCompetitiveReport,
} from "@/lib/reports/generator";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/reports/exporters";
import * as XLSX from "xlsx";

export async function POST(request) {
    try {
        const { type, filters = {}, format = "json" } = await request.json();

        if (!type) {
            return NextResponse.json({ error: "Report type is required" }, { status: 400 });
        }

        // Generate report based on type
        let reportData;
        switch (type) {
            case "inventory":
                reportData = await generateInventoryReport(filters);
                break;
            case "margin":
                reportData = await generateMarginReport(filters);
                break;
            case "sales":
                reportData = await generateSalesReport(filters);
                break;
            case "competitive":
                reportData = await generateCompetitiveReport(filters);
                break;
            default:
                return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

        // Return JSON if no export format specified
        if (format === "json") {
            return NextResponse.json({
                success: true,
                report: reportData,
            });
        }

        // Handle export formats
        if (format === "pdf") {
            const pdf = exportToPDF(reportData);
            const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

            return new NextResponse(pdfBuffer, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${type}-report-${Date.now()}.pdf"`,
                },
            });
        }

        if (format === "csv") {
            const csv = exportToCSV(reportData);

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${type}-report-${Date.now()}.csv"`,
                },
            });
        }

        if (format === "excel") {
            const workbook = exportToExcel(reportData);
            const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            return new NextResponse(excelBuffer, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${type}-report-${Date.now()}.xlsx"`,
                },
            });
        }

        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
