# **Create Task**

Create a new generation task

#### **Request Parameters**

The API accepts a JSON payload with the following structure:

##### Request Body Structure

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }

}

##### Root Level Parameters

modelRequiredstring

The model name to use for generation

Example:

"elevenlabs/text-to-dialogue-v3"

callBackUrlOptionalstring

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

"https://your-domain.com/api/callback"

##### Input Object Parameters

The input object contains the following parameters based on the form configuration:

input.stabilityOptionalnumber

Determines how stable the voice is and the randomness between each generation.

Min: 0, Max: 1, Step: 0.5

Example:

0.5

input.language\_codeOptionalstring

Select description

Available options:

auto\-Auto

af\-Afrikaans

ar\-Arabic

hy\-Armenian

as\-Assamese

az\-Azerbaijani

be\-Belarusian

bn\-Bengali

bs\-Bosnian

bg\-Bulgarian

ca\-Catalan

ceb\-Cebuano

ny\-Chichewa

hr\-Croatian

cs\-Czech

da\-Danish

nl\-Dutch

en\-English

et\-Estonian

fil\-Filipino

fi\-Finnish

fr\-French

gl\-Galician

ka\-Georgian

de\-German

el\-Greek

gu\-Gujarati

ha\-Hausa

he\-Hebrew

hi\-Hindi

hu\-Hungarian

is\-Icelandic

id\-Indonesian

ga\-Irish

it\-Italian

ja\-Japanese

jv\-Javanese

kn\-Kannada

kk\-Kazakh

ky\-Kirghiz

ko\-Korean

lv\-Latvian

ln\-Lingala

lt\-Lithuanian

lb\-Luxembourgish

mk\-Macedonian

ms\-Malay

ml\-Malayalam

zh\-Mandarin Chinese

mr\-Marathi

ne\-Nepali

no\-Norwegian

ps\-Pashto

fa\-Persian

pl\-Polish

pt\-Portuguese

pa\-Punjabi

ro\-Romanian

ru\-Russian

sr\-Serbian

sd\-Sindhi

sk\-Slovak

sl\-Slovenian

so\-Somali

es\-Spanish

sw\-Swahili

sv\-Swedish

ta\-Tamil

te\-Telugu

th\-Thai

tr\-Turkish

uk\-Ukrainian

ur\-Urdu

vi\-Vietnamese

cy\-Welsh

Example:

"auto"

input.dialogueRequiredarray(object)

Array of dialogue objects. Each object contains text content and voice selection.

Total text length of all dialogues cannot exceed 5000 characters

Object structure:

text\-string (required) \- Dialogue text content, max 5000 characters

voice\-string (required) \- Voice character name

Available voices:

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

Example:

\[  
  {  
    "text": "\[excitedly\] Hey Jessica\! Have you tried the new ElevenLabs V3?",  
    "voice": "TX3LPaxmHKxFdv7VOQHJ"  
  },  
  {  
    "text": "\[curiously\] Yeah, just got it\! The emotion is so amazing. I can actually do whispers now— \[whispering\] like this\!",  
    "voice": "cgSgspJ2msm6clMCkdW9"  
  }

\]

### **Request Example**

cURL

JavaScript

Python  
curl \-X POST "https://api.kie.ai/api/v1/jobs/createTask" \\  
  \-H "Content-Type: application/json" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-d '{  
    "model": "elevenlabs/text-to-dialogue-v3",  
    "callBackUrl": "https://your-domain.com/api/callback",  
    "input": {  
      "stability": 0.5,  
      "language\_code": "auto",  
      "dialogue": \[  
        {  
          "text": "\[excitedly\] Hey Jessica\! Have you tried the new ElevenLabs V3?",  
          "voice": "TX3LPaxmHKxFdv7VOQHJ"  
        },  
        {  
          "text": "\[curiously\] Yeah, just got it\! The emotion is so amazing. I can actually do whispers now— \[whispering\] like this\!",  
          "voice": "cgSgspJ2msm6clMCkdW9"  
        }  
      \]  
    }

}'

### **Response Example**

{  
  "code": 200,  
  "message": "success",  
  "data": {  
    "taskId": "task\_12345678"  
  }

}

#### **Response Fields**

codeStatus code, 200 for success, others for failure

messageResponse message, error description when failed

data.taskIdTask ID for querying task status

### **Callback Notifications**

When you provide the callBackUrl parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

{  
    "code": 200,  
    "data": {  
        "completeTime": 1755599644000,  
        "costTime": 8,  
        "createTime": 1755599634000,  
        "model": "elevenlabs/text-to-dialogue-v3",  
        "param": "{\\"callBackUrl\\":\\"https://your-domain.com/api/callback\\",\\"model\\":\\"elevenlabs/text-to-dialogue-v3\\",\\"input\\":{\\"stability\\":0.5,\\"language\_code\\":\\"auto\\",\\"dialogue\\":\[{\\"text\\":\\"\[excitedly\] Hey Jessica\! Have you tried the new ElevenLabs V3?\\",\\"voice\\":\\"TX3LPaxmHKxFdv7VOQHJ\\"},{\\"text\\":\\"\[curiously\] Yeah, just got it\! The emotion is so amazing. I can actually do whispers now— \[whispering\] like this\!\\",\\"voice\\":\\"cgSgspJ2msm6clMCkdW9\\"}\]}}",  
        "resultJson": "{\\"resultUrls\\":\[\\"https://example.com/generated-image.jpg\\"\]}",  
        "state": "success",  
        "taskId": "e989621f54392584b05867f87b160672",  
        "failCode": null,  
        "failMsg": null,  
    },  
    "msg": "Playground task completed successfully."

}

#### **Failure Callback Example**

{  
    "code": 501,  
    "data": {  
        "completeTime": 1755597081000,  
        "costTime": 0,  
        "createTime": 1755596341000,  
        "failCode": "500",  
        "failMsg": "Internal server error",  
        "model": "elevenlabs/text-to-dialogue-v3",  
        "param": "{\\"callBackUrl\\":\\"https://your-domain.com/api/callback\\",\\"model\\":\\"elevenlabs/text-to-dialogue-v3\\",\\"input\\":{\\"stability\\":0.5,\\"language\_code\\":\\"auto\\",\\"dialogue\\":\[{\\"text\\":\\"\[excitedly\] Hey Jessica\! Have you tried the new ElevenLabs V3?\\",\\"voice\\":\\"TX3LPaxmHKxFdv7VOQHJ\\"},{\\"text\\":\\"\[curiously\] Yeah, just got it\! The emotion is so amazing. I can actually do whispers now— \[whispering\] like this\!\\",\\"voice\\":\\"cgSgspJ2msm6clMCkdW9\\"}\]}}",  
        "state": "fail",  
        "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",  
        "resultJson": null,  
    },  
    "msg": "Playground task failed."

}

##### Important Notes

* The callback content structure is identical to the Query Task API response  
* The param field contains the complete Create Task request parameters, not just the input section  
* If callBackUrl is not provided, no callback notifications will be sent

**Query Task**  
Query task status and results by task ID

### **Request Example**

cURL

JavaScript

Python  
curl \-X GET "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task\_12345678" \\

  \-H "Authorization: Bearer YOUR\_API\_KEY"

### **Response Example**

{  
  "code": 200,  
  "message": "success",  
  "data": {  
    "taskId": "task\_12345678",  
    "model": "elevenlabs/text-to-dialogue-v3",  
    "state": "success",  
    "param": "{\\"model\\":\\"elevenlabs/text-to-dialogue-v3\\",\\"callBackUrl\\":\\"https://your-domain.com/api/callback\\",\\"input\\":{\\"stability\\":0.5,\\"language\_code\\":\\"auto\\",\\"dialogue\\":\[{\\"text\\":\\"\[excitedly\] Hey Jessica\! Have you tried the new ElevenLabs V3?\\",\\"voice\\":\\"TX3LPaxmHKxFdv7VOQHJ\\"},{\\"text\\":\\"\[curiously\] Yeah, just got it\! The emotion is so amazing. I can actually do whispers now— \[whispering\] like this\!\\",\\"voice\\":\\"cgSgspJ2msm6clMCkdW9\\"}\]}}",  
    "resultJson": "{\\"resultUrls\\":\[\\"https://example.com/generated-image.jpg\\"\]}",  
    "failCode": "",  
    "failMsg": "",  
    "costTime": 0,  
    "completeTime": 1698765432000,  
    "createTime": 1698765400000  
  }

}

#### **Response Fields**

codeStatus code, 200 for success, others for failure

messageResponse message, error description when failed

data.taskIdTask ID

data.modelModel used for generation

data.stateGeneration state

data.paramComplete Create Task request parameters as JSON string (includes model, callBackUrl, input and all other parameters)

data.resultJsonResult JSON string containing generated media URLs

data.failCodeError code (when generation failed)

data.failMsgError message (when generation failed)

data.completeTimeCompletion timestamp

data.createTimeCreation timestamp

data.costTimeCost time in milliseconds

##### State Values

waitingWaiting for generation

queuingIn queue

generatingGenerating

successGeneration successful

failGeneration failed  
