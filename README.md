## nodejs-aws-step-function-rekognition

A NodeJS flow with AWS Step Functions to analyze images in batch.
This code was made to analyze the images with an already trained model.

# AWS Step Functions image flow

![](https://raw.githubusercontent.com/vazraphael/nodejs-aws-step-function-rekognition/master/doc/stepfunctions_graph.png)

# Installation

This script was made with NodeJS v12+.

### 1º step

Clone this repository and run the script below on a Ubuntu terminal (WSL) to install all the dependencies.

```sh
npm install
```

### 2º step

Configure ```.env``` file.


```
BUCKET_NAME=
MY_AWS_ACCESS_KEY_ID=
MY_AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

REKOGNITION_PROJECT_ARN=arn:aws:rekognition:{REGION}:{ACCOUNT_NUMBER}:project/{PROJECT_NAME}/{SERIAL}
REKOGNITION_MODEL_ARN=arn:aws:rekognition:{REGION}:{ACCOUNT_NUMER}:project/{PROJECT_NAME}/version/{VERSION}/{SERIAL}
# max results you want in a single image
REKOGNITION_MAX_RESULTS=500
# how much confidence you want in your rekognition
REKOGNITION_MIN_CONFIDENCE=90
```

You need to set MY_AWS_ACCESS_KEY_ID and MY_AWS_SECRET_ACCESS_KEY. <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey" target="_blank">Click here</a> if you don't know how to find or create access key.


You can find the <strong>PROJECT ARN</strong> and <strong>MODEL ARN</strong> at Custom Labels > Projects > {Select Project} > {Select Model} > click on tab Use Model and then search for API Code, select Python, go to line 30 and 31.


### 3º step

Create a role in AWS, go to https://console.aws.amazon.com/iamv2/home#/roles, Create Role.
In Commom use cases, select Lambda and then Next.
Add ```AmazonS3FullAccess```, ```AmazonRekognitionFullAccess``` and ```AWSLambda_FullAccess```, then click Next: Tags, Next: Review, insert the Role name and then Create Role.

You will have to create 4 function in Lambda with the name ```event-start```, ```event-start-model```, ```event-detect``` and ```event-stop-model```

Go to Lambda service, click on Create Function, select Author from scratch.

Follow the image below

![](https://raw.githubusercontent.com/vazraphael/nodejs-aws-step-function-rekognition/master/doc/lambda.png)

Now, for every function you created, you have to change the Handler to the same name as the function you created concatenated with .handler
Example:

![](https://raw.githubusercontent.com/vazraphael/nodejs-aws-step-function-rekognition/master/doc/lambda2.png)

### 4º step

Configure a bucket in S3 and upload some images to analyze. Don't forget to put this bucket name in the ```.env``` file.

Change the file ```./images.js``` with the uploaded images.

Now create a zip file of this folder and upload to those Lambda functions.

### 5º step

Replace the {REGION} and {ACCOUNT_NUMBER} in the JSON below, or replace with the ARN of Lambda functions.

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

Go to Step Functions, click on Create state machine, select <strong>Write your workflow in code</strong>, paste the json above with your replacements in Definition, click on Next, insert State machine name and then click on Create state machine.

![](https://raw.githubusercontent.com/vazraphael/nodejs-aws-step-function-rekognition/master/doc/step-function.png)

Access your created state machines and click Start execution.

## Notes

- Remember to Stop the model after the execution is done, because you're charged if the model is RUNNING.
- You can create a event on Amazon EventBridge to trigger the Step Function in a determined time.

That's it, have fun!

## License

ISC

## Contact Information

vazraphael@gmail.com
