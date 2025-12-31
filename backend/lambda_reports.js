
import pool from './db.js';

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
            const { reportType, fromDate, toDate, employeeId } = JSON.parse(event.body);

            let query = "";
            let params = [fromDate, toDate];

            if (reportType === 'Attendance') {
                query = `SELECT a.*, e.name FROM attendance a JOIN employees e ON a.employee_id = e.employee_id WHERE a.date >= $1 AND a.date <= $2 AND a.tenant_id = '${tenantId}'`;
            } else {
                query = `SELECT l.*, e.name FROM leaves l JOIN employees e ON l.employee_id = e.employee_id WHERE l.start_date >= $1 AND l.start_date <= $2 AND l.tenant_id = '${tenantId}'`;
            }

            if (employeeId && employeeId !== 'All Employees') {
                query += ` AND e.name = $3`;
                params.push(employeeId);
            }

            const res = await client.query(query, params);

            // In a real app, we would use a library like 'csv-writer' or 'pdfkit' here.
            // For now, we return the data summary and a mock download URI.
            return createResponse(200, {
                reportName: `${reportType}_Report_${fromDate}_to_${toDate}`,
                recordCount: res.rows.length,
                downloadUrl: `https://s3.amazonaws.com/portals-reports/${reportType.toLowerCase()}_export.pdf?token=mock_token`,
                data: res.rows
            });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
