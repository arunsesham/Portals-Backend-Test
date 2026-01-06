
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
                // Fetch attendance data where:
                // 1. Single-day records (`start_date` IS NULL) fall within range
                // 2. Multi-day records (`start_date` IS NOT NULL) OVERLAP with the range
                //    Overlap Logic: (StartA <= EndB) AND (EndA >= StartB)
                query = `
                    SELECT a.date, e.name, a.status, a.check_in, a.check_out, a.total_hours, a.start_date, a.end_date, a.total_days 
                    FROM attendance a 
                    JOIN employees e ON a.employee_id = e.employee_id 
                    WHERE a.tenant_id = '${tenantId}' AND (
                        (a.start_date IS NULL AND a.date >= $1 AND a.date <= $2)
                        OR
                        (a.start_date IS NOT NULL AND a.start_date <= $2 AND a.end_date >= $1)
                    )
                `;

                if (employeeId && employeeId !== 'All Employees') {
                    query += ` AND e.name = $3`; // Using Name as per UI request
                    params.push(employeeId);
                }
                // Order isn't strictly necessary for the map logic but good for debugging raw data
                query += ' ORDER BY a.date DESC';

                const attRes = await client.query(query, params);
                const attendanceRecords = attRes.rows;

                // Fetch Holidays
                const holRes = await client.query(`SELECT date, name FROM holidays WHERE date >= $1 AND date <= $2 AND tenant_id = '${tenantId}' AND is_active = TRUE`, [fromDate, toDate]);
                const holidays = holRes.rows;

                // Generate Calendar Data
                const start = new Date(fromDate);
                const end = new Date(toDate);
                const fullData = [];

                // Helper to get array of dates
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

                    // Find Holiday
                    const holiday = holidays.find(h => {
                        const hDate = typeof h.date === 'string' ? h.date : new Date(h.date).toISOString().split('T')[0];
                        return hDate === dateStr;
                    });

                    // If Specific Employee is selected, we map JUST that employee for every day
                    // If "All Employees", we should ideally list ALL employees for EVERY day, but that's a Cartesian product (Employees * Days). 
                    // Given the user request "each day corresponds to employee name", and "All option could also possible", 
                    // let's assume if ALL is selected, we group by Employee? Or we just list the actual attendance records + gaps?
                    // User said: "sheet should be an exact data like a calender days, each day correspods to employee name, applied or not"
                    // This implies for "All Employees", we need a row for EVERY employee for EVERY day.

                    // Fetch list of RELEVANT employees
                    let employeesToMap = [];
                    if (employeeId && employeeId !== 'All Employees') {
                        employeesToMap = [{ name: employeeId }];
                    } else {
                        const allEmps = await client.query(`SELECT name FROM employees WHERE tenant_id = '${tenantId}' AND is_active = TRUE ORDER BY name ASC`);
                        employeesToMap = allEmps.rows;
                    }

                    employeesToMap.forEach(emp => {
                        // Find attendance record for this specific day
                        const att = attendanceRecords.find(a => {
                            if (a.name !== emp.name) return false;

                            // Check 1: Multi-day range match
                            if (a.start_date && a.end_date) {
                                // Assuming start_date/end_date in DB are 'YYYY-MM-DD' strings
                                return dateStr >= a.start_date && dateStr <= a.end_date;
                            }

                            // Check 2: Single-day match
                            const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
                            return aDate === dateStr;
                        });

                        let status = 'Absent'; // Default
                        let displayStart = '-';
                        let displayEnd = '-';
                        let displayDuration = '-';

                        if (att) {
                            status = att.status;
                            // Priority Logic: Start/End Date > Check In/Out
                            displayStart = att.start_date || att.check_in || '-';
                            displayEnd = att.end_date || att.check_out || '-';
                            displayDuration = att.total_days || att.total_hours || '-';
                        } else if (holiday) {
                            status = `Holiday: ${holiday.name}`;
                        } else if (isWeekend) {
                            status = 'Weekend';
                        }

                        fullData.push({
                            date: dateStr,
                            name: emp.name,
                            status: status,
                            start_time: displayStart,
                            end_time: displayEnd,
                            duration: displayDuration,
                            day: dayName
                        });
                    });
                }

                data = fullData; // Replace raw query data with generated calendar data

            } else {
                // Leaves (Keep existing logic for now, or update if requested later)
                query = `SELECT l.start_date, l.end_date, e.name, l.type, l.status, l.reason FROM leaves l JOIN employees e ON l.employee_id = e.employee_id WHERE l.start_date >= $1 AND l.start_date <= $2 AND l.tenant_id = '${tenantId}'`;

                if (employeeId && employeeId !== 'All Employees') {
                    query += ` AND e.name = $3`;
                    params.push(employeeId);
                }
                query += ' ORDER BY l.start_date DESC';
                const res = await client.query(query, params);
                data = res.rows;
            }

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
                    const dateStr = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0]; // Safe check
                    const text = reportType === 'Attendance'
                        ? `${dateStr} (${row.day}) - ${row.name} - ${row.status} (${row.start_time} - ${row.end_time})`
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
                        { header: 'Day', key: 'day', width: 15 },
                        { header: 'Employee', key: 'name', width: 20 },
                        { header: 'Status', key: 'status', width: 25 },
                        { header: 'Start Time / Date', key: 'start_time', width: 20 },
                        { header: 'End Time / Date', key: 'end_time', width: 20 },
                        { header: 'Duration', key: 'duration', width: 15 }
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
