import type {NestedStackProps, StackProps} from 'aws-cdk-lib';
import {RemovalPolicy, Stack} from 'aws-cdk-lib';
import type {Method} from 'aws-cdk-lib/aws-apigateway';
import {
    AccessLogFormat,
    Deployment,
    EndpointType,
    LogGroupLogDestination,
    MethodLoggingLevel,
    RequestValidator,
    RestApi,
    Stage,
} from 'aws-cdk-lib/aws-apigateway';
import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import type {Construct} from 'constructs';
import {RestLambdaStack} from './lambda.stack';

interface RestStackProps extends StackProps, NestedStackProps {
    readonly nestedStacks: number
    readonly nestedStacksSize: number
}

export class RestStack extends Stack {
    constructor(scope: Construct, id: string, props: RestStackProps) {
        super(scope, id, props);
        const apiVersion = 'v1';


        const restApi = new RestApi(this, `${id}-${apiVersion}`, {
            restApiName: `${id}-${apiVersion}`,
            endpointConfiguration: {
                types: [EndpointType.PRIVATE],
            },
            deploy: false,
        });
        restApi.root.addMethod('ANY');

        const getValidator = new RequestValidator(this, `${id}-query-params-validator`, {
            restApi,
            validateRequestParameters: true,
            validateRequestBody: false,
        })

        const postValidator = new RequestValidator(this, `${id}-query-params-and-body-validator`, {
            restApi,
            validateRequestParameters: true,
            validateRequestBody: true,
        })


        const restApiLogGroup = new LogGroup(this, `${id}-log`, {
            logGroupName: `${id}-log-group`,
            removalPolicy: RemovalPolicy.DESTROY,
            retention: RetentionDays.ONE_WEEK,
        });

        const methods = [...Array(props.nestedStacks).keys()].reduce(
            (
                p: Method[],
                c: number,
            ) => {
                const stack = new RestLambdaStack(this, `stack_${c}`, {
                    getValidator,
                    postValidator,
                    restApiId: restApi.restApiId,
                    rootResourceId: restApi.restApiRootResourceId,
                    size: props.nestedStacksSize,
                });
                return p.concat(stack.methods)
            },
            [],
        );

        const deployment = new Deployment(this, `${id}-deployment-${new Date().toISOString()}`, {
            api: restApi,
        });

        methods.forEach(method => deployment.node.addDependency(method))

        new Stage(this, `${id}-stage`, {
            deployment,
            stageName: apiVersion,
            loggingLevel: MethodLoggingLevel.INFO,
            dataTraceEnabled: true,
            accessLogDestination: new LogGroupLogDestination(restApiLogGroup),
            accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        });
    }
}
