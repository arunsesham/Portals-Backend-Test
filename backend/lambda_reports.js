
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
                // 1. Fetch Employees with Supervisor Name
                let empQuery = `
                    SELECT e.employee_id, e.name, e.department, m.name as supervisor 
                    FROM employees e 
                    LEFT JOIN employees m ON e.manager_id = m.employee_id 
                    WHERE e.tenant_id = '${tenantId}' AND e.is_active = TRUE
                `;
                if (employeeId && employeeId !== 'All Employees') {
                    empQuery += ` AND e.name = '${employeeId}'`;
                }
                empQuery += ` ORDER BY e.name ASC`;
                const empRes = await client.query(empQuery);
                const employees = empRes.rows;

                // 2. Fetch Attendance Records (Range Only)
                const attQuery = `
                    SELECT a.employee_id, a.date, a.status, a.work_mode, a.type, a.start_date, a.end_date
                    FROM attendance a 
                    WHERE a.tenant_id = '${tenantId}' AND (
                        (a.start_date IS NULL AND a.date >= $1 AND a.date <= $2)
                        OR
                        (a.start_date IS NOT NULL AND a.start_date <= $2 AND a.end_date >= $1)
                    )
                `;
                const attRes = await client.query(attQuery, [fromDate, toDate]);
                const attendanceRecords = attRes.rows;

                // 3. Fetch Leave Records (Range Only)
                const leaveQuery = `
                    SELECT l.employee_id, l.type, l.status, l.start_date, l.end_date
                    FROM leaves l
                    WHERE l.tenant_id = '${tenantId}' AND (
                        l.start_date <= $2 AND l.end_date >= $1
                    )
                `;
                const leaveRes = await client.query(leaveQuery, [fromDate, toDate]);
                const leaveRecords = leaveRes.rows;

                // 4. Fetch Holidays
                const holRes = await client.query(`SELECT date, name FROM holidays WHERE date >= $1 AND date <= $2 AND tenant_id = '${tenantId}' AND is_active = TRUE`, [fromDate, toDate]);
                const holidays = holRes.rows;

                // 5. Build Date Array (DD-MM-YYYY keys)
                const dateKeys = [];
                for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
                    // Format: DD-MM-YYYY
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const key = `${day}-${month}-${year}`;

                    // Also keep ISO for comparison
                    dateKeys.push({
                        key: key,
                        iso: d.toISOString().split('T')[0],
                        obj: new Date(d)
                    });
                }

                // 6. Build Matrix Data
                data = employees.map(emp => {
                    const row = {
                        employee_id: emp.employee_id,
                        name: emp.name,
                        supervisor: emp.supervisor || '-',
                        department: emp.department || '-'
                    };

                    dateKeys.forEach(dk => {
                        const dateIso = dk.iso;
                        // Find matches
                        const atts = attendanceRecords.filter(a => {
                            if (a.employee_id !== emp.employee_id) return false;
                            if (a.start_date && a.end_date) return dateIso >= a.start_date && dateIso <= a.end_date;
                            const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
                            return aDate === dateIso;
                        });

                        const leaves = leaveRecords.filter(l => {
                            if (l.employee_id !== emp.employee_id) return false;
                            return dateIso >= l.start_date && dateIso <= l.end_date;
                        });

                        let cellValue = 'Pending (Not Applied)';

                        const approvedLeave = leaves.find(l => l.status === 'Approved');
                        const approvedAtt = atts.find(a => a.status === 'Approved');

                        if (approvedAtt) {
                            if (approvedAtt.type === 'compoff') cellValue = 'Comp';
                            else if (approvedAtt.type === 'odt') cellValue = 'ODT';
                            else if (approvedAtt.work_mode === 'Work From Office') cellValue = 'WFO';
                            else if (approvedAtt.work_mode === 'Work From Home') cellValue = 'WFH';
                            else cellValue = (approvedAtt.work_mode || approvedAtt.type || 'Present').toUpperCase();
                        } else if (approvedLeave) {
                            cellValue = 'Leave';
                        } else {
                            const pendingLeave = leaves.find(l => l.status === 'Pending');
                            const pendingAtt = atts.find(a => a.status === 'Pending');
                            if (pendingLeave || pendingAtt) cellValue = 'Pending Approval';
                            else {
                                const holiday = holidays.find(h => {
                                    const hDate = typeof h.date === 'string' ? h.date : new Date(h.date).toISOString().split('T')[0];
                                    return hDate === dateIso;
                                });
                                const dayName = dk.obj.toLocaleDateString('en-US', { weekday: 'long' });
                                const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

                                if (holiday) cellValue = `Holiday: ${holiday.name}`;
                                else if (isWeekend) cellValue = 'Weekend';
                            }
                        }
                        row[dk.key] = cellValue;
                    });
                    return row;
                });

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

                // Text logic for Matrix (Simplified for PDF: List Format)
                doc.fontSize(10);
                data.forEach((row, i) => {
                    let rowText = `${row.name}: `;
                    Object.keys(row).forEach(k => {
                        if (k.match(/\d+\-\d+\-\d{4}/)) { // is date in DD-MM-YYYY format
                            rowText += `[${k}: ${row[k]}] `;
                        } else if (k.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            // Fallback for leaves report or other formats
                            rowText += `[${k}: ${row[k]}] `;
                        }
                    });
                    doc.text(rowText);
                    doc.moveDown(0.5);
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
                    // Dynamic Columns: Static + Dates (DD-MM-YYYY)
                    const columns = [
                        { header: 'EmployeeId', key: 'employee_id', width: 10 },
                        { header: 'Name', key: 'name', width: 20 },
                        { header: 'Supervisor', key: 'supervisor', width: 20 },
                        { header: 'Department', key: 'department', width: 15 }
                    ];

                    const dates = [];
                    for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        dates.push(`${day}-${month}-${year}`);
                    }

                    dates.forEach(d => {
                        columns.push({ header: d, key: d, width: 15 });
                    });

                    sheet.columns = columns;
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
