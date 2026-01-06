
import pool from './db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (method === 'POST') {
            const { reportType, fromDate, toDate, employeeId, exportType } = JSON.parse(event.body);

            let query = "";
            let params = [fromDate, toDate];
            let data = [];

            if (reportType === 'Attendance') {
                query = `SELECT a.date, e.name, a.status, a.start_date, a.end_date, a.total_days FROM attendance a JOIN employees e ON a.employee_id = e.employee_id WHERE a.date >= $1 AND a.date <= $2 AND a.tenant_id = '${tenantId}'`;
            } else {
                // Leaves
                query = `SELECT l.start_date, l.end_date, e.name, l.type, l.status, l.reason FROM leaves l JOIN employees e ON l.employee_id = e.employee_id WHERE l.start_date >= $1 AND l.start_date <= $2 AND l.tenant_id = '${tenantId}'`;
            }

            if (employeeId && employeeId !== 'All Employees') {
                query += ` AND e.name = $3`; // Using name search as per previous context or ID? Previous context used Name in UI but often ID in backend. Let's assume ID is passed but "All Employees" is string value.
                // Wait, previous code used `e.name = $3`. Let's stick to that if UI sends name. 
                // Or if UI sends ID, we should change query.
                // Safest is to check if it looks like a UUID or Number. But original code used `e.name`.
                params.push(employeeId);
            }

            query += reportType === 'Attendance' ? ' ORDER BY a.date DESC' : ' ORDER BY l.start_date DESC';

            const res = await client.query(query, params);
            data = res.rows;

            if (exportType === 'PDF') {
                const doc = new PDFDocument();
                const buffers = [];
                const stream = new PassThrough();

                doc.pipe(stream);

                // Content
                doc.fontSize(20).text(`${reportType} Report`, { align: 'center' });
                doc.fontSize(12).text(`From: ${fromDate} To: ${toDate}`, { align: 'center' });
                doc.moveDown();

                data.forEach((row, i) => {
                    const dateStr = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0];
                    const text = reportType === 'Attendance'
                        ? `${dateStr} - ${row.name} - ${row.status} (${row.start_date || '-'} to ${row.end_date || '-'})`
                        : `${row.start_date} to ${row.end_date} - ${row.name} - ${row.type} (${row.status})`;
                    doc.text(`${i + 1}. ${text}`);
                });

                doc.end();

                // Collect buffer
                for await (const chunk of stream) {
                    buffers.push(chunk);
                }
                const buffer = Buffer.concat(buffers);

                return {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename=${reportType}_Report.pdf`
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                };

            } else if (exportType === 'Excel') {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet(reportType);

                if (reportType === 'Attendance') {
                    sheet.columns = [
                        { header: 'Date', key: 'date', width: 15 },
                        { header: 'Employee', key: 'name', width: 20 },
                        { header: 'Status', key: 'status', width: 15 },
                        { header: 'Check In', key: 'start_date', width: 15 },
                        { header: 'Check Out', key: 'end_date', width: 15 },
                        { header: 'Total Days', key: 'total_days', width: 15 }
                    ];
                } else {
                    sheet.columns = [
                        { header: 'Start Date', key: 'start_date', width: 15 },
                        { header: 'End Date', key: 'end_date', width: 15 },
                        { header: 'Employee', key: 'name', width: 20 },
                        { header: 'Type', key: 'type', width: 15 },
                        { header: 'Status', key: 'status', width: 15 },
                        { header: 'Reason', key: 'reason', width: 30 }
                    ];
                }

                sheet.addRows(data);

                // Formatting Date columns if needed (converting DB dates to JS Date objects might be needed for ExcelJS proper formatting, but raw strings often usually fine)
                // For simplicity, passing raw row data which matches keys.

                const buffer = await workbook.xlsx.writeBuffer();

                return {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "Content-Disposition": `attachment; filename=${reportType}_Report.xlsx`
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                };
            } else {
                // Return JSON Data (Preview)
                return createResponse(200, {
                    reportName: `${reportType}_Report_${fromDate}_to_${toDate}`,
                    recordCount: data.length,
                    data: data
                });
            }
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
