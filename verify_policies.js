// Set Dummy Credentials for Testing BEFORE imports if possible, 
// but since imports hoist, we might need to rely on the environment being set before node runs,
// or modify how we invoke it. 
// However, AWS SDK reads env vars lazily often. Let's try setting them here.
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.AWS_REGION = 'us-east-1';

// Mock Event specific to API Gateway Proxy
const createEvent = (method, path, pathParams, body, queryParams) => ({
    httpMethod: method,
    path: path,
    pathParameters: pathParams,
    queryStringParameters: queryParams,
    body: body ? JSON.stringify(body) : null,
    requestContext: { http: { path: path } } // for the alternative path check
});

// Since we can't easily run the actual DB connection if it depends on VPC/Lambda env, 
// I'll write this script to be run by the user or if the user has a local DB setup.
// Assuming the user has a local setup because of `local_server.js`.

import { handler } from './backend/lambda_policies.js';

async function runTest() {
    console.log("--- Starting Policy Verification ---");

    // 1. Create Policy
    console.log("\n1. Creating Policy...");
    const createEventObj = createEvent('POST', '/policies', null, {
        policy_id: `pol-${Date.now()}`,
        policy_name: "Test Policy",
        policy_type: "HR",
        description: "Test Description",
        created_by: "AdminUser",
        filename: "policy_v1.pdf"
    });

    // We expect this to fail if DB isn't reachable, but we'll try. 
    // If it fails, I'll ask user to run or provide the SQL.
    try {
        const createRes = await handler(createEventObj);
        console.log("Create Res:", createRes);

        if (createRes.statusCode === 201) {
            const body = JSON.parse(createRes.body);
            const policyId = body.policy_id;
            const versionId = body.version_id;

            // 2. Approve Version 1
            console.log("\n2. Approving Version 1...");
            const approveEvent = createEvent('PATCH', `/policies/${policyId}/versions/${versionId}/status`, { id: policyId }, {
                status: 'APPROVED',
                version_id: versionId
            });
            const approveRes = await handler(approveEvent);
            console.log("Approve Res:", approveRes);

            // 3. Get Policy (as Employee)
            console.log("\n3. Getting Policy (Employee)...");
            const getEvent = createEvent('GET', `/policies/${policyId}`, { id: policyId });
            const getRes = await handler(getEvent);
            console.log("Get Res:", getRes);

            // 4. Create New Version
            console.log("\n4. Creating New Version...");
            const v2Event = createEvent('POST', `/policies/${policyId}/versions`, { id: policyId }, {
                created_by: "AdminUser",
                change_summary: "Fixed typos",
                filename: "policy_v2.pdf"
            });
            v2Event.path = `/policies/${policyId}/versions`; // Ensure path is correct for check
            const v2Res = await handler(v2Event);
            console.log("Create V2 Res:", v2Res);

            // 5. List Versions
            console.log("\n5. Listing Versions...");
            const listVerEvent = createEvent('GET', `/policies/${policyId}/versions`, { id: policyId });
            listVerEvent.path = `/policies/${policyId}/versions`;
            const listVerRes = await handler(listVerEvent);
            console.log("List Versions Res:", listVerRes);
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

runTest();
