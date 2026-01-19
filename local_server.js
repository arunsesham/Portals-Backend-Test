
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import Lambda Handlers
import { handler as employeesHandler } from './backend/lambda_employees.js';
import { handler as attendanceHandler } from './backend/lambda_attendance.js';
import { handler as leavesHandler } from './backend/lambda_leaves.js';
import { handler as approvalsHandler } from './backend/lambda_approvals.js';
import { handler as dashboardHandler } from './backend/lambda_dashboard.js';
import { handler as ticketsHandler } from './backend/lambda_tickets.js';
import { handler as holidaysHandler } from './backend/lambda_holidays.js';
import { handler as leaderboardHandler } from './backend/lambda_leaderboard.js';
import { handler as compoffHandler } from './backend/lambda_compoff.js';
import { handler as announcementsHandler } from './backend/lambda_announcements.js';
import { handler as policiesHandler } from './backend/lambda_policies.js';
import { handler as recruitmentHandler } from './backend/lambda_recruitment.js';
import { handler as referralsHandler } from './backend/lambda_referrals.js';
import { handler as configHandler } from './backend/lambda_config.js';
import { handler as reportsHandler } from './backend/lambda_reports.js';
import { handler as documentsHandler } from './backend/lambda_documents.js';
import { handler as dropdownsHandler } from './backend/lambda_dropdowns.js';
//import { handler as dropdownCategoriesHandler } from './backend/lambda_dropdown_categories.js';



const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const lambdaBridge = async (handler, req, res) => {
    const event = {
        httpMethod: req.method,
        body: JSON.stringify(req.body),
        pathParameters: req.params,
        queryStringParameters: req.query,
        path: req.path,
        requestContext: { httpMethod: req.method, path: req.path }
    };

    try {
        const result = await handler(event);
        if (result.isBase64Encoded) {
            res.status(result.statusCode).set(result.headers).send(Buffer.from(result.body, 'base64'));
        } else {
            res.status(result.statusCode).set(result.headers).send(result.body);
        }
    } catch (error) {
        console.error("Local Server Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Dashboard & Config
app.get('/dashboard', (req, res) => lambdaBridge(dashboardHandler, req, res));
app.get('/dashboard/attendance-summary', (req, res) => lambdaBridge(dashboardHandler, req, res));
app.get('/config', (req, res) => lambdaBridge(configHandler, req, res));
app.post('/config', (req, res) => lambdaBridge(configHandler, req, res));

// HR/Admin Content Management
app.get('/announcements', (req, res) => lambdaBridge(announcementsHandler, req, res));
app.post('/announcements', (req, res) => lambdaBridge(announcementsHandler, req, res));
app.put('/announcements/:id', (req, res) => lambdaBridge(announcementsHandler, req, res));
app.delete('/announcements/:id', (req, res) => lambdaBridge(announcementsHandler, req, res));

app.get('/policies', (req, res) => lambdaBridge(policiesHandler, req, res));
app.post('/policies', (req, res) => lambdaBridge(policiesHandler, req, res));
app.get('/policies/:id', (req, res) => lambdaBridge(policiesHandler, req, res));
app.put('/policies/:id', (req, res) => lambdaBridge(policiesHandler, req, res));
app.post('/policies/:id/versions', (req, res) => lambdaBridge(policiesHandler, req, res));
app.get('/policies/:id/versions', (req, res) => lambdaBridge(policiesHandler, req, res));
app.get('/policies/:id/versions/:versionId', (req, res) => lambdaBridge(policiesHandler, req, res));
app.patch('/policies/:id/versions/:versionId/status', (req, res) => lambdaBridge(policiesHandler, req, res));

// Holidays
app.get('/holidays/:id', (req, res) => lambdaBridge(holidaysHandler, req, res));
app.get('/holidays', (req, res) => lambdaBridge(holidaysHandler, req, res));
app.post('/holidays', (req, res) => lambdaBridge(holidaysHandler, req, res));
app.put('/holidays/:id', (req, res) => lambdaBridge(holidaysHandler, req, res));
app.delete('/holidays/:id', (req, res) => lambdaBridge(holidaysHandler, req, res));

// Employees & Leaderboard
app.get('/employees', (req, res) => lambdaBridge(employeesHandler, req, res));
app.post('/employees', (req, res) => lambdaBridge(employeesHandler, req, res));
app.get('/employees/:id', (req, res) => lambdaBridge(employeesHandler, req, res));
app.put('/employees/:id', (req, res) => lambdaBridge(employeesHandler, req, res));
app.put('/employees/:id', (req, res) => lambdaBridge(employeesHandler, req, res));
app.delete('/employees/:id', (req, res) => lambdaBridge(employeesHandler, req, res));
// Avatar Routes
app.post('/employees/:id/avatar/upload-url', (req, res) => lambdaBridge(employeesHandler, req, res));
app.post('/employees/:id/avatar', (req, res) => lambdaBridge(employeesHandler, req, res));
app.delete('/employees/:id/avatar', (req, res) => lambdaBridge(employeesHandler, req, res));
app.post('/leaderboard', (req, res) => lambdaBridge(leaderboardHandler, req, res));

// Work Modules
app.get('/attendance', (req, res) => lambdaBridge(attendanceHandler, req, res));
app.post('/attendance', (req, res) => lambdaBridge(attendanceHandler, req, res));
app.get('/leaves/:id', (req, res) => lambdaBridge(leavesHandler, req, res));
app.post('/leaves', (req, res) => lambdaBridge(leavesHandler, req, res));
app.get('/leaves', (req, res) => lambdaBridge(leavesHandler, req, res));
app.get('/approvals/:managerId', (req, res) => lambdaBridge(approvalsHandler, req, res));
app.put('/approvals/:managerId', (req, res) => lambdaBridge(approvalsHandler, req, res));

// Recruitment & Referrals
app.get('/jobs', (req, res) => lambdaBridge(recruitmentHandler, req, res));
app.post('/jobs', (req, res) => lambdaBridge(recruitmentHandler, req, res));
app.put('/jobs/:id', (req, res) => lambdaBridge(recruitmentHandler, req, res));
app.get('/referrals', (req, res) => lambdaBridge(referralsHandler, req, res));
app.post('/referrals', (req, res) => lambdaBridge(referralsHandler, req, res));

// Helpdesk
app.get('/tickets', (req, res) => lambdaBridge(ticketsHandler, req, res));
app.post('/tickets', (req, res) => lambdaBridge(ticketsHandler, req, res));
app.put('/tickets/:id', (req, res) => lambdaBridge(ticketsHandler, req, res));

// Reports & Documents (S3 Mocks)
app.post('/reports', (req, res) => lambdaBridge(reportsHandler, req, res));
app.get('/documents', (req, res) => lambdaBridge(documentsHandler, req, res));
app.post('/documents', (req, res) => lambdaBridge(documentsHandler, req, res));

app.get('/dropdowns', (req, res) =>
    lambdaBridge(dropdownsHandler, req, res)
);
app.get('/dropdowns/:key', (req, res) =>
    lambdaBridge(dropdownsHandler, req, res)
);
app.post('/dropdowns', (req, res) =>
    lambdaBridge(dropdownsHandler, req, res)
);
app.put('/dropdowns/:id', (req, res) =>
    lambdaBridge(dropdownsHandler, req, res)
);
app.delete('/dropdowns/:id', (req, res) =>
    lambdaBridge(dropdownsHandler, req, res)
);

// // Dropdown Categories
// app.get('/dropdown-categories', (req, res) =>
//     lambdaBridge(dropdownCategoriesHandler, req, res)
// );

// app.post('/dropdown-categories', (req, res) =>
//     lambdaBridge(dropdownCategoriesHandler, req, res)
// );

// app.put('/dropdown-categories/:id', (req, res) =>
//     lambdaBridge(dropdownCategoriesHandler, req, res)
// );

// app.delete('/dropdown-categories/:id', (req, res) =>
//     lambdaBridge(dropdownCategoriesHandler, req, res)
// );


app.listen(PORT, () => {
    console.log(`🚀 Portals Pro Local Backend running at http://localhost:${PORT}`);
});
