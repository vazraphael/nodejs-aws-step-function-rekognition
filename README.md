## nodejs-aws-step-function-rekognition

A NodeJS flow with AWS Step Functions to analyze images in batch.
This code was made to analyze the images with an already trained model.

# AWS Step Functions image flow

![](https://raw.githubusercontent.com/vazraphael/nodejs-aws-step-function-rekognition/master/doc/stepfunctions_graph.png)

## AWS Step Functions JSON flow
```json
{
  "StartAt": "Verify if exist images to analyze",
  "States": {
    "Verify if exist images to analyze": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:{REGION}:{ACCOUNT_NUMBER}:function:event-start:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Exist?"
    },
    "Exist?": {
      "Choices": [
        {
          "Variable": "$.Payload",
          "StringEquals": "start",
          "Next": "Start model"
        }
      ],
      "Default": "Finish",
      "Type": "Choice"
    },
    "Start model": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:{REGION}:{ACCOUNT_NUMBER}:function:event-start-model:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Verify model status"
    },
    "Exist more?": {
      "Choices": [
        {
          "Variable": "$.Payload",
          "StringEquals": "stop",
          "Next": "Stop model in execution"
        }
      ],
      "Default": "Verify if exist images to analyze",
      "Type": "Choice"
    },
    "Finish": {
      "Type": "Succeed"
    },
    "Verify model status": {
      "Choices": [
        {
          "Variable": "$.Payload",
          "StringEquals": "RUNNING",
          "Next": "Process images"
        }
      ],
      "Default": "Wait for the model to start",
      "Type": "Choice"
    },
    "Process images": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:{REGION}:{ACCOUNT_NUMBER}:function:event-detect:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "States.Timeout"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Verify if exist more images"
    },
    "Verify if exist more images": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:{REGION}:{ACCOUNT_NUMBER}:function:event-start:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Exist more?",
      "Comment": "I just added this step to make a better looking flow"
    },
    "Stop model in execution": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:{REGION}:{ACCOUNT_NUMBER}:function:event-stop-model:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Finish"
    },
    "Wait for the model to start": {
      "Next": "Start model",
      "Seconds": 300,
      "Type": "Wait",
      "Comment": "5 minutes"
    }
  }
}
```
# Installation

This script was made with NodeJS v12+.

### 1º Step

Clone this repository and run the script below on a Ubuntu terminal (WSL) to install all the dependencies.

```sh
npm install
```

