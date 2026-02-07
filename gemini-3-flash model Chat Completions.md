# **Chat Completions**

Generate chat completions using the gemini-3-flash model. The model name is specified in the URL path.

#### **Request Parameters**

The Chat Completions API accepts a JSON payload with the following structure. Note: The model name is specified in the URL path, not in the request body.

##### Request Body Structure

{  
  "messages": \[  
    {  
      "role": "developer" | "system" | "user" | "assistant" | "tool",  
      "content": array  
    }  
  \],  
  "stream": true | false,  // optional, default: true,  
  "include\_thoughts": true | false,  // optional, default: true,  
  "reasoning\_effort": "low" | "high",  // optional, default: "high",  
  "tools": \[  // optional  
    {  
      "type": "function",  
      "function": {  
        "name": "yourFunctionName",  
        "parameters": { /\* function parameters here \*/ }  
      }  
    }  
  \]

}

##### Parameters Details

messagesRequiredarray

An array of message objects. Each message has a role and content.

Supported message roles:

developer

Developer-provided instructions that the model should follow, regardless of user messages. In o1 models and newer versions, developer messages replace the previous system messages.

system

Developer-provided instructions that the model should follow, regardless of user messages. In o1 models and newer versions, please use developer messages instead.

user

Messages sent by end users, containing prompts or additional context information.

assistant

Messages sent by the model in response to user messages.

tool

Content of tool messages.

Content Array \- Media Files:

Unified Media File Format:

In the content array, whether it's images, videos, audio, or other document types, all media files use the same format structure:

* The type field is always "image\_url"  
* The image\_url field name remains unchanged  
* The only thing that changes is the url value, which points to the corresponding media file address

For example: images, videos, audio, PDFs, and other documents all use the same { type: 'image\_url', image\_url: { url: '...' } } structure.

Example:

\[  
  {  
    "role": "user",  
    "content": \[  
      {  
        "type": "text",  
        "text": "What is in this image?"  
      },  
      {  
        "type": "image\_url",  
        "image\_url": {  
          "url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1759055072437dqlsclj2.png"  
        }  
      }  
    \]  
  }

\]

streamOptionalboolean

If set to true, partial message deltas will be sent as server-sent events. Default is true.

Example:

true

include\_thoughtsOptionalboolean

When set to true, the model's thinking process will be included in the response. Default is true.

Thinking Process:

When enabled, you can see the model's reasoning steps and thought process before it generates the final response. This is useful for understanding complex problem-solving and decision-making.

Example:

true

reasoning\_effortOptionalstring

Controls the amount of reasoning effort the model should expend. Higher values result in more thorough reasoning but may increase latency. Default is "high".

Supported values:

low

Minimal reasoning effort, fastest response time. Suitable for simple queries.

high

Maximum reasoning effort, slower response time. Best for complex problems requiring deep analysis. Default value.

Example:

"high"

toolsOptionalarray

An optional array that allows you to define functions the model can call. The array can contain multiple objects. When using function calling, you can define multiple functions in the array.

Example (Custom Functions):

\[  
  {  
    "type": "function",  
    "function": {  
      "name": "get\_weather",  
      "description": "Get the current weather in a given location",  
      "parameters": {  
        "type": "object",  
        "properties": {  
          "location": {  
            "type": "string",  
            "description": "The city and state, e.g. San Francisco, CA"  
          },  
          "unit": {  
            "type": "string",  
            "enum": \[  
              "celsius",  
              "fahrenheit"  
            \]  
          }  
        },  
        "required": \[  
          "location"  
        \]  
      }  
    }  
  },  
  {  
    "type": "function",  
    "function": {  
      "name": "get\_stock\_price",  
      "description": "Get the current stock price",  
      "parameters": {  
        "type": "object",  
        "properties": {  
          "symbol": {  
            "type": "string",  
            "description": "Stock symbol, e.g. AAPL"  
          }  
        },  
        "required": \[  
          "symbol"  
        \]  
      }  
    }  
  }

\]

### **Request Example**

cURL

JavaScript

Python  
curl \-X POST "https://api.kie.ai/gemini-3-flash/v1/chat/completions" \\  
  \-H "Content-Type: application/json" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-d '{  
    "messages": \[  
      {  
        "role": "user",  
        "content": \[  
          {  
            "type": "text",  
            "text": "What is in this image?"  
          },  
          {  
            "type": "image\_url",  
            "image\_url": {  
              "url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1759055072437dqlsclj2.png"  
            }  
          }  
        \]  
      }  
    \],  
    "stream": true,  
    "include\_thoughts": true,  
    "reasoning\_effort": "high",  
    "tools": \[  
      {  
        "type": "function",  
        "function": {  
          "name": "yourFunctionName",  
          "parameters": {}  
        }  
      }  
    \]

  }'

### **Response Example**

data: {"choices":\[{"delta":{"content":"","role":"assistant"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{"reasoning\_content":"\*\*Understanding the Greeting\*\*\\n\\nI've just finished analyzing the input, \\"Hello\\". I've determined it's a greeting in English, and its meaning is straightforward. Now, I'm focusing on the user's intent to provide a suitable response.\\n\\n\\n"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{"reasoning\_content":"\*\*Composing a Reply\*\*\\n\\nI'm now formulating a response, drawing on previous steps. I considered several options, from basic greetings to more conversational approaches. The goal is to be polite, helpful, and acknowledge the user. I've landed on a combination of a greeting and an offer of assistance, as it's the standard practice. I am now refining the output, including both a greeting and a follow-up.\\n\\n\\n"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{"reasoning\_content":"\*\*Synthesizing the Perfect Reply\*\*\\n\\nI'm now integrating all stages. I selected the best combination of politeness and helpfulness. The final output needs to be warm, and open-ended. I'm focusing on \\"Hello\! How can I help you today?\\" The tone feels right, and allows for both simple conversation, or more demanding queries. I am satisfied.\\n\\n\\n"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{"reasoning\_content":"\*\*Dissecting the Rationale\*\*\\n\\nI'm now deeply immersed in the process I undertook. I'm taking apart each stage of my reasoning, from the initial analysis of \\"Hello\\" to the ultimate selection of the response. I'm focusing on why I chose the greeting \\"Hello\!\\" and the follow-up, and comparing it against alternative approaches. I'm trying to see if I made any choices that might be improved.\\n\\n\\n"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{"content":"Hello\! It's great to meet you. How can I help you today?\\n\\nWhether it's answering questions, assisting with writing, translating languages, or just having a conversation, I'm here and ready to help\!"},"index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[{"delta":{},"finish\_reason":"stop","index":0}\],"created":1768293339,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk"}

data: {"choices":\[\],"created":1768293339,"credits\_consumed":0.49,"id":"chatcmpl-\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*RsFPnU8A","model":"gemini-3-flash","object":"chat.completion.chunk","system\_fingerprint":"","usage":{"completion\_tokens":698,"completion\_tokens\_details":{"audio\_tokens":0,"text\_tokens":0,"reasoning\_tokens":663},"prompt\_tokens":1,"total\_tokens":699}}

data: \[DONE\]

#### **Response Fields**

data:Each streaming chunk starts with "data:" prefix

idUnique identifier for the chat completion

objectThe object type (chat.completion.chunk for streaming)

createdUnix timestamp of when the completion was created

modelThe model used for generation

choicesArray of completion choices

choices\[\].indexThe index of the choice in the array

choices\[\].deltaThe delta content for streaming responses

choices\[\].delta.roleThe role of the message (assistant, only in first chunk)

choices\[\].delta.contentThe incremental content of the message

choices\[\].delta.reasoning\_contentThe reasoning process content when include\_thoughts is enabled

choices\[\].finish\_reasonThe reason the completion finished (null for ongoing, "stop" when complete)

credits\_consumedThe number of credits consumed for this request

usageToken usage statistics

usage.prompt\_tokensNumber of tokens in the prompt

usage.completion\_tokensNumber of tokens in the completion

usage.completion\_tokens\_detailsDetailed breakdown of completion tokens

usage.completion\_tokens\_details.reasoning\_tokensNumber of tokens used for reasoning process

usage.completion\_tokens\_details.text\_tokensNumber of tokens used for text content

usage.completion\_tokens\_details.audio\_tokensNumber of tokens used for audio content

usage.total\_tokensTotal tokens used

system\_fingerprintSystem fingerprint for the completion (in final chunk)

\[DONE\]Final marker indicating the stream has ended  
