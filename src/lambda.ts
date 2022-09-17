import type {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => ({
    statusCode: 200,
    body: JSON.stringify({health: 'ok'})
})