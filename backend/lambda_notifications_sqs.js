import pool from './db.js';
import {
    SESClient,
    SendTemplatedEmailCommand,
    GetTemplateCommand,
    CreateTemplateCommand
} from "@aws-sdk/client-ses";

const SES_REGION = "ap-south-1";
const VERIFIED_SENDER = "arun.sesham@tvarana.com";
const SYSTEM_EMAIL = "system@tvarana.com";
const APP_NAME = "Portals Pro";
const TEMPLATE_NAME = "EMP_LEAVE_STATUS_BRANDED_V6"; // Glassmorphism Version

const sesClient = new SESClient({ region: SES_REGION });

export const handler = async (event) => {
    const batchItemFailures = [];

    // Ensure template exists before processing batch
    try {
        await ensureLeaveTemplateExists();
    } catch (e) {
        console.error("Template Init Error:", e);
    }

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error(`Failed to process message ${record.messageId}:`, error);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }

    return { batchItemFailures };
};

const processRecord = async (record) => {
    const sqsMessageId = record.messageId;
    const body = JSON.parse(record.body);

    let snsMessage;
    if (body.Message) {
        snsMessage = typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message;
    } else {
        snsMessage = body;
    }

    const {
        eventType,
        employeeId,
        tenantId,
        entityType,
        title,
        message,
        icon,
        priority,
        expiresAt
    } = snsMessage;

    if (!employeeId || !tenantId || !title || !message) {
        throw new Error(`Missing required fields in message: ${JSON.stringify(snsMessage)}`);
    }

    // 1. Insert Notification into DB
    const query = `
        INSERT INTO notifications (
            id, employee_id, tenant_id, title, message, notification_type, 
            entity_type, icon, priority, created_at, expires_at, is_read, mail_sent
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, FALSE
        )
        ON CONFLICT (id) DO NOTHING
    `;

    const createdAt = new Date().toISOString();
    const values = [
        sqsMessageId, employeeId, tenantId, title, message,
        eventType, entityType, icon, priority || 'NORMAL', createdAt, expiresAt
    ];

    await pool.query(query, values);
    console.log(`DB Notification inserted: ${sqsMessageId}`);

    // 2. Send SES Email for Approvals/Rejections
    if (["LEAVE_APPROVED", "LEAVE_REJECTED"].includes(eventType)) {
        await handleEmailSending(employeeId, tenantId, eventType, message);
    }
};

const handleEmailSending = async (employeeId, tenantId, eventType, messageText) => {
    // Fetch Employee Email
    const empRes = await pool.query('SELECT name, email FROM employees WHERE employee_id = $1 AND tenant_id = $2', [employeeId, tenantId]);
    if (empRes.rows.length === 0) {
        console.error(`Employee ${employeeId} not found, skipping email.`);
        return;
    }
    const employee = empRes.rows[0];

    const isApproved = eventType === "LEAVE_APPROVED";

    // V6 Glassmorphism Logic
    // Background Mesh Gradients

    const subject = isApproved ? "Leave Request Approved" : "Leave Request Update";
    const statusText = isApproved ? "APPROVED" : "REJECTED";

    let heading = "Update Received";
    let mainIcon = "✨";

    if (isApproved) {
        if (messageText.match(/sick/i)) {
            heading = "Get Well Soon!";
            mainIcon = "🍵";
        } else if (messageText.match(/casual|vacation|trip|holiday/i)) {
            heading = "Enjoy your time off!";
            mainIcon = "🏞️";
        } else if (messageText.match(/work from home|wfh/i)) {
            heading = "WFH Approved";
            mainIcon = "🏡";
        } else {
            heading = "Request Approved";
            mainIcon = "👍";
        }
    } else {
        heading = "Request Declined";
        mainIcon = "✋";
    }

    const templateData = {
        employeeName: employee.name.split(' ')[0],
        subject,
        heading,
        statusText,
        // Mesh Gradient BG
        bgGradient: isApproved ?
            "radial-gradient(at 0% 0%, hsla(84,82%,57%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(168,76%,60%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(190,80%,60%,1) 0, transparent 50%)"
            :
            "radial-gradient(at 0% 0%, hsla(0,82%,57%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(20,76%,60%,1) 0, transparent 50%)",
        accentColor: isApproved ? "#a3e635" : "#ef4444",
        mainIcon,
        bodyMessage: messageText,
        portalLink: "https://portals-pro.tvarana.com/leaves",
        year: new Date().getFullYear()
    };

    const params = {
        Source: `${APP_NAME} <${VERIFIED_SENDER}>`,
        Destination: { ToAddresses: [employee.email] },
        ReplyToAddresses: [SYSTEM_EMAIL],
        Template: TEMPLATE_NAME,
        TemplateData: JSON.stringify(templateData)
    };

    await sesClient.send(new SendTemplatedEmailCommand(params));
    console.log(`SES Email sent to ${employee.email}`);
};

async function ensureLeaveTemplateExists() {
    try {
        await sesClient.send(new GetTemplateCommand({ TemplateName: TEMPLATE_NAME }));
    } catch (err) {
        if (err.name === "TemplateDoesNotExistException") {
            await createBrandedTemplate();
        } else {
            throw err;
        }
    }
}

async function createBrandedTemplate() {

    const htmlPart = `<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600&family=Outfit:wght@300;400;500;600&display=swap');
        
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f3f4f6; 
            font-family: 'Outfit', sans-serif; 
            color: #334155; 
            -webkit-font-smoothing: antialiased;
        }

        .wrapper {
            width: 100%;
            padding: 60px 0;
            background-color: #f3f4f6; /* Brand Gray */
        }

        .card {
            max-width: 480px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 32px;
            border: 1px solid #e2e8f0;
            /* Very light, natural shadow */
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            text-align: center;
            position: relative;
        }

        .status-bubble {
            display: inline-block;
            margin-top: 40px;
            background: #f1f5f9;
            color: #475569;
            padding: 6px 14px;
            border-radius: 100px;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 1px;
            text-transform: uppercase;
            border: 1px solid #e2e8f0;
        }

        .icon-container {
            margin: 25px auto 5px;
            font-size: 64px;
            line-height: 1;
        }

        .content { 
            padding: 10px 40px 50px; 
        }

        h1 { 
            margin: 0 0 12px; 
            font-family: 'Clash Display', sans-serif;
            font-size: 32px; 
            font-weight: 600; 
            color: #0f172a;
            letter-spacing: -0.02em;
            line-height: 1.2;
        }

        p { 
            font-size: 16px; 
            line-height: 1.6; 
            color: #64748b; 
            margin-bottom: 32px;
            font-weight: 400;
        }

        .btn {
            display: inline-block;
            padding: 18px 45px;
            background: #a3e635; /* Your requested lime color */
            color: #1a2e05 !important; /* Dark green text for better legibility and style */
            text-decoration: none;
            font-weight: 600;
            border-radius: 16px; 
            transition: all 0.2s ease;
            font-size: 15px;
        }

        .btn:hover { 
            background: #bef264; /* Slight lighten on hover */
            transform: translateY(-2px);
        }

        .footer { 
            padding-top: 30px; 
            text-align: center; 
            font-size: 11px; 
            color: #94a3b8; 
            font-weight: 500; 
            text-transform: uppercase; 
            letter-spacing: 1.5px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="status-bubble">{{statusText}}</div>
            <div class="icon-container">
                {{mainIcon}}
            </div>
            <div class="content">
                <h1>{{heading}}</h1>
                <p>
                    Hi {{employeeName}},<br>
                    {{bodyMessage}}<br><br>
                    Regards,<br>
                    HR Department
                </p>
                <a href="{{portalLink}}" class="btn">View Details &rarr;</a>
            </div>
        </div>
        <div class="footer">
            Portals Pro
        </div>
    </div>
</body>
</html>`;

    const template = {
        TemplateName: TEMPLATE_NAME,
        SubjectPart: "{{subject}}",
        HtmlPart: htmlPart,
        TextPart: "Hi {{employeeName}}, {{statusText}}: {{bodyMessage}}. Check portal."
    };

    await sesClient.send(new CreateTemplateCommand({ Template: template }));
    console.log("Branded SES Template V6 Created: " + TEMPLATE_NAME);
}