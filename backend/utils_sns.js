import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

export const publishNotification = async (payload) => {
    try {
        const topicArn = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:ap-south-1:745651872221:portals-pro-sns.fifo';
        if (!topicArn) {
            console.warn("SNS_TOPIC_ARN is not set. Skipping notification.");
            return;
        }
        const params = {
            TopicArn: topicArn,
            Message: JSON.stringify(payload),
            MessageGroupId: "approvals"
        };

        if (topicArn.endsWith('.fifo')) {
            params.MessageGroupId = payload.tenantId || 'global';
            // Use entityType + entityId for deduplication if available, else standard UUID
            params.MessageDeduplicationId = (payload.entityType && payload.entityId)
                ? `${payload.entityType}_${payload.entityId}_${payload.eventType}`
                : (payload.id || Date.now().toString());
        }

        console.log(`Publishing to SNS: ${topicArn} (FIFO: ${topicArn.endsWith('.fifo')})`);

        const command = new PublishCommand(params);
        const response = await snsClient.send(command);
        console.log("SNS Publish Success:", response.MessageId);
        return response;
    } catch (error) {
        console.error("SNS Publish Error:", error);
    }
};
