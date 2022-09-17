import type {NestedStackProps} from 'aws-cdk-lib';
import {NestedStack, StackProps} from 'aws-cdk-lib';
import type {Method, RequestValidator} from 'aws-cdk-lib/aws-apigateway';
import {JsonSchemaType, LambdaIntegration, Model, RestApi} from 'aws-cdk-lib/aws-apigateway';
import type {ISecurityGroup, Vpc} from 'aws-cdk-lib/aws-ec2';
import type {Construct} from 'constructs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";

interface LambdaStackProps extends StackProps, NestedStackProps {
    readonly restApiId: string;
    readonly rootResourceId: string;
    readonly getValidator: RequestValidator;
    readonly postValidator: RequestValidator;
    readonly size: number
}

export class RestLambdaStack extends NestedStack {
    public readonly methods: Method[] = [];

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);
        const restApi = RestApi.fromRestApiAttributes(this, 'RestApi', {
            restApiId: props.restApiId,
            rootResourceId: props.rootResourceId,
        });
        const handler = new NodejsFunction(this, 'test-lambda', {
            memorySize: 128,
            functionName: 'test-lambda',
            runtime: Runtime.NODEJS_16_X,
            handler: 'handler',
            entry: require('path').resolve(`src/lambda.ts`),
            bundling: {
                minify: true,
            },
        })

        this.methods = [...Array(props.size).keys()].reduce((p: Method[], c) => {
            const endpoint = `func-${id}_${c}`
            const resource = restApi.root.addResource(endpoint);
            const integration = new LambdaIntegration(handler);
            ['GET', 'POST', 'PATCH'].forEach(verb => {
                const method = resource.addMethod(verb, integration, {
                    requestValidator: verb === 'GET' ? props.getValidator : props.postValidator,
                    requestParameters: {'method.request.querystring.param': true},
                    requestModels: verb !== 'GET'
                        ? {
                            'application/json': new Model(
                                this,
                                `${verb}_${endpoint}_${id}_model`,
                                {
                                    restApi,
                                    contentType: 'application/json',
                                    schema: {
                                        type: JsonSchemaType.OBJECT,
                                        minProperties: 1,
                                        maxProperties: 1,
                                        additionalProperties: false,
                                        properties: {
                                            data: {
                                                type: JsonSchemaType.OBJECT,
                                                minProperties: 1,
                                                additionalProperties: false,
                                                properties: {
                                                    prop: {type: JsonSchemaType.STRING},
                                                },
                                            },
                                        },
                                    },
                                },
                            ),
                        } : undefined,
                });
                p = p.concat(method);
            })
            return p;
        }, []);
    }
}
