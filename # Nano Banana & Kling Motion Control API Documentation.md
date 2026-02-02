# \# Nano Banana API Documentation

\# Nano Banana API Documentation

\> Generate content using the Nano Banana model

\#\# Overview

This document describes how to use the Nano Banana model for content generation. The process consists of two steps:  
1\. Create a generation task  
2\. Query task status and results

\#\# Authentication

All API requests require a Bearer Token in the request header:

\`\`\`  
Authorization: Bearer YOUR\_API\_KEY  
\`\`\`

Get API Key:  
1\. Visit \[API Key Management Page\](https://kie.ai/api-key) to get your API Key  
2\. Add to request header: \`Authorization: Bearer YOUR\_API\_KEY\`

\---

\#\# 1\. Create Generation Task

\#\#\# API Information  
\- \*\*URL\*\*: \`POST https://api.kie.ai/api/v1/jobs/createTask\`  
\- \*\*Content-Type\*\*: \`application/json\`

\#\#\# Request Parameters

| Parameter | Type | Required | Description |  
|-----------|------|----------|-------------|  
| model | string | Yes | Model name, format: \`google/nano-banana\` |  
| input | object | Yes | Input parameters object |  
| callBackUrl | string | No | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or fail). If not provided, no callback notifications will be sent. Example: \`"https://your-domain.com/api/callback"\` |

\#\#\# Model Parameter

The \`model\` parameter specifies which AI model to use for content generation.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Format\*\* | \`google/nano-banana\` | The exact model identifier for this API |  
| \*\*Type\*\* | string | Must be passed as a string value |  
| \*\*Required\*\* | Yes | This parameter is mandatory for all requests |

\> \*\*Note\*\*: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

\#\#\# Callback URL Parameter

The \`callBackUrl\` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Purpose\*\* | Task completion notification | Receive real-time updates when your task finishes |  
| \*\*Method\*\* | POST request | The system sends POST requests to your callback URL |  
| \*\*Timing\*\* | When task completes | Notifications sent for both success and failure states |  
| \*\*Content\*\* | Query Task API response | Callback content structure is identical to the Query Task API response |  
| \*\*Parameters\*\* | Complete request data | The \`param\` field contains the complete Create Task request parameters, not just the input section |  
| \*\*Optional\*\* | Yes | If not provided, no callback notifications will be sent |

\*\*Important Notes:\*\*  
\- The callback content structure is identical to the Query Task API response  
\- The \`param\` field contains the complete Create Task request parameters, not just the input section    
\- If \`callBackUrl\` is not provided, no callback notifications will be sent

\#\#\# input Object Parameters

\#\#\#\# prompt  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: The prompt for image generation  
\- \*\*Max Length\*\*: 20000 characters  
\- \*\*Default Value\*\*: \`"A surreal painting of a giant banana floating in space, stars and galaxies in the background, vibrant colors, digital art"\`

\#\#\#\# output\_format  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Output format for the images  
\- \*\*Options\*\*:  
  \- \`png\`: PNG  
  \- \`jpeg\`: JPEG  
\- \*\*Default Value\*\*: \`"png"\`

\#\#\#\# image\_size  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Radio description  
\- \*\*Options\*\*:  
  \- \`1:1\`: 1:1  
  \- \`9:16\`: 9:16  
  \- \`16:9\`: 16:9  
  \- \`3:4\`: 3:4  
  \- \`4:3\`: 4:3  
  \- \`3:2\`: 3:2  
  \- \`2:3\`: 2:3  
  \- \`5:4\`: 5:4  
  \- \`4:5\`: 4:5  
  \- \`21:9\`: 21:9  
  \- \`auto\`: auto  
\- \*\*Default Value\*\*: \`"1:1"\`

\#\#\# Request Example

\`\`\`json  
{  
  "model": "google/nano-banana",  
  "input": {  
    "prompt": "A surreal painting of a giant banana floating in space, stars and galaxies in the background, vibrant colors, digital art",  
    "output\_format": "png",  
    "image\_size": "1:1"  
  }  
}  
\`\`\`  
\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9"  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID for querying task status |

\---

\#\# 2\. Query Task Status

\#\#\# API Information  
\- \*\*URL\*\*: \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
\- \*\*Parameter\*\*: \`taskId\` (passed via URL parameter)

\#\#\# Request Example  
\`\`\`  
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9  
\`\`\`

\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9",  
    "model": "google/nano-banana",  
    "state": "waiting",  
    "param": "{\\"model\\":\\"google/nano-banana\\",\\"input\\":{\\"prompt\\":\\"A surreal painting of a giant banana floating in space, stars and galaxies in the background, vibrant colors, digital art\\",\\"output\_format\\":\\"png\\",\\"image\_size\\":\\"1:1\\"}}",  
    "resultJson": "{\\"resultUrls\\":\[\\"https://file.aiquickdraw.com/custom-page/akr/section-images/1756223371764w82dsmi4.png\\"\]}",  
    "failCode": null,  
    "failMsg": null,  
    "costTime": null,  
    "completeTime": null,  
    "createTime": 1757584164490  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID |  
| data.model | string | Model name used |  
| data.state | string | Task status: \`waiting\`(waiting),  \`success\`(success), \`fail\`(fail) |  
| data.param | string | Task parameters (JSON string) |  
| data.resultJson | string | Task result (JSON string, available when task is success). Structure depends on outputMediaType: \`{resultUrls: \[\]}\` for image/media/video, \`{resultObject: {}}\` for text |  
| data.failCode | string | Failure code (available when task fails) |  
| data.failMsg | string | Failure message (available when task fails) |  
| data.costTime | integer | Task duration in milliseconds (available when task is success) |  
| data.completeTime | integer | Completion timestamp (available when task is success) |  
| data.createTime | integer | Creation timestamp |

\---

\#\# Usage Flow

1\. \*\*Create Task\*\*: Call \`POST https://api.kie.ai/api/v1/jobs/createTask\` to create a generation task  
2\. \*\*Get Task ID\*\*: Extract \`taskId\` from the response  
3\. \*\*Wait for Results\*\*:   
   \- If you provided a \`callBackUrl\`, wait for the callback notification  
   \- If no \`callBackUrl\`, poll status by calling \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
4\. \*\*Get Results\*\*: When \`state\` is \`success\`, extract generation results from \`resultJson\`

\#\# Error Codes

| Status Code | Description |  
|-------------|-------------|  
| 200 | Request successful |  
| 400 | Invalid request parameters |  
| 401 | Authentication failed, please check API Key |  
| 402 | Insufficient account balance |  
| 404 | Resource not found |  
| 422 | Parameter validation failed |  
| 429 | Request rate limit exceeded |  
| 500 | Internal server error |

# \# Nano Banana Edit API Documentation

\# Nano Banana Edit API Documentation

\> Generate content using the Nano Banana Edit model

\#\# Overview

This document describes how to use the Nano Banana Edit model for content generation. The process consists of two steps:  
1\. Create a generation task  
2\. Query task status and results

\#\# Authentication

All API requests require a Bearer Token in the request header:

\`\`\`  
Authorization: Bearer YOUR\_API\_KEY  
\`\`\`

Get API Key:  
1\. Visit \[API Key Management Page\](https://kie.ai/api-key) to get your API Key  
2\. Add to request header: \`Authorization: Bearer YOUR\_API\_KEY\`

\---

\#\# 1\. Create Generation Task

\#\#\# API Information  
\- \*\*URL\*\*: \`POST https://api.kie.ai/api/v1/jobs/createTask\`  
\- \*\*Content-Type\*\*: \`application/json\`

\#\#\# Request Parameters

| Parameter | Type | Required | Description |  
|-----------|------|----------|-------------|  
| model | string | Yes | Model name, format: \`google/nano-banana-edit\` |  
| input | object | Yes | Input parameters object |  
| callBackUrl | string | No | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or fail). If not provided, no callback notifications will be sent. Example: \`"https://your-domain.com/api/callback"\` |

\#\#\# Model Parameter

The \`model\` parameter specifies which AI model to use for content generation.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Format\*\* | \`google/nano-banana-edit\` | The exact model identifier for this API |  
| \*\*Type\*\* | string | Must be passed as a string value |  
| \*\*Required\*\* | Yes | This parameter is mandatory for all requests |

\> \*\*Note\*\*: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

\#\#\# Callback URL Parameter

The \`callBackUrl\` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Purpose\*\* | Task completion notification | Receive real-time updates when your task finishes |  
| \*\*Method\*\* | POST request | The system sends POST requests to your callback URL |  
| \*\*Timing\*\* | When task completes | Notifications sent for both success and failure states |  
| \*\*Content\*\* | Query Task API response | Callback content structure is identical to the Query Task API response |  
| \*\*Parameters\*\* | Complete request data | The \`param\` field contains the complete Create Task request parameters, not just the input section |  
| \*\*Optional\*\* | Yes | If not provided, no callback notifications will be sent |

\*\*Important Notes:\*\*  
\- The callback content structure is identical to the Query Task API response  
\- The \`param\` field contains the complete Create Task request parameters, not just the input section    
\- If \`callBackUrl\` is not provided, no callback notifications will be sent

\#\#\# input Object Parameters

\#\#\#\# prompt  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: The prompt for image editing  
\- \*\*Max Length\*\*: 20000 characters  
\- \*\*Default Value\*\*: \`"turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible"\`

\#\#\#\# image\_urls  
\- \*\*Type\*\*: \`array\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: Please provide the URL of the uploaded file,List of URLs of input images for editing,up to 10 images.  
\- \*\*Max File Size\*\*: 10MB  
\- \*\*Accepted File Types\*\*: image/jpeg, image/png, image/webp  
\- \*\*Multiple Files\*\*: Yes  
\- \*\*Default Value\*\*: \`\["https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"\]\`

\#\#\#\# output\_format  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Output format for the images  
\- \*\*Options\*\*:  
  \- \`png\`: PNG  
  \- \`jpeg\`: JPEG  
\- \*\*Default Value\*\*: \`"png"\`

\#\#\#\# image\_size  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Radio description  
\- \*\*Options\*\*:  
  \- \`1:1\`: 1:1  
  \- \`9:16\`: 9:16  
  \- \`16:9\`: 16:9  
  \- \`3:4\`: 3:4  
  \- \`4:3\`: 4:3  
  \- \`3:2\`: 3:2  
  \- \`2:3\`: 2:3  
  \- \`5:4\`: 5:4  
  \- \`4:5\`: 4:5  
  \- \`21:9\`: 21:9  
  \- \`auto\`: auto  
\- \*\*Default Value\*\*: \`"1:1"\`

\#\#\# Request Example

\`\`\`json  
{  
  "model": "google/nano-banana-edit",  
  "input": {  
    "prompt": "turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",  
    "image\_urls": \["https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"\],  
    "output\_format": "png",  
    "image\_size": "1:1"  
  }  
}  
\`\`\`  
\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9"  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID for querying task status |

\---

\#\# 2\. Query Task Status

\#\#\# API Information  
\- \*\*URL\*\*: \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
\- \*\*Parameter\*\*: \`taskId\` (passed via URL parameter)

\#\#\# Request Example  
\`\`\`  
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9  
\`\`\`

\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9",  
    "model": "google/nano-banana-edit",  
    "state": "waiting",  
    "param": "{\\"model\\":\\"google/nano-banana-edit\\",\\"input\\":{\\"prompt\\":\\"turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible\\",\\"image\_urls\\":\[\\"https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png\\"\],\\"output\_format\\":\\"png\\",\\"image\_size\\":\\"1:1\\"}}",  
    "resultJson": "{\\"resultUrls\\":\[\\"https://file.aiquickdraw.com/custom-page/akr/section-images/1756260298615p09gs2nz.webp\\"\]}",  
    "failCode": null,  
    "failMsg": null,  
    "costTime": null,  
    "completeTime": null,  
    "createTime": 1757584164490  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID |  
| data.model | string | Model name used |  
| data.state | string | Task status: \`waiting\`(waiting),  \`success\`(success), \`fail\`(fail) |  
| data.param | string | Task parameters (JSON string) |  
| data.resultJson | string | Task result (JSON string, available when task is success). Structure depends on outputMediaType: \`{resultUrls: \[\]}\` for image/media/video, \`{resultObject: {}}\` for text |  
| data.failCode | string | Failure code (available when task fails) |  
| data.failMsg | string | Failure message (available when task fails) |  
| data.costTime | integer | Task duration in milliseconds (available when task is success) |  
| data.completeTime | integer | Completion timestamp (available when task is success) |  
| data.createTime | integer | Creation timestamp |

\---

\#\# Usage Flow

1\. \*\*Create Task\*\*: Call \`POST https://api.kie.ai/api/v1/jobs/createTask\` to create a generation task  
2\. \*\*Get Task ID\*\*: Extract \`taskId\` from the response  
3\. \*\*Wait for Results\*\*:   
   \- If you provided a \`callBackUrl\`, wait for the callback notification  
   \- If no \`callBackUrl\`, poll status by calling \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
4\. \*\*Get Results\*\*: When \`state\` is \`success\`, extract generation results from \`resultJson\`

\#\# Error Codes

| Status Code | Description |  
|-------------|-------------|  
| 200 | Request successful |  
| 400 | Invalid request parameters |  
| 401 | Authentication failed, please check API Key |  
| 402 | Insufficient account balance |  
| 404 | Resource not found |  
| 422 | Parameter validation failed |  
| 429 | Request rate limit exceeded |  
| 500 | Internal server error |

# \# Nano Banana Pro API Documentation

\# Nano Banana Pro API Documentation

\> Generate content using the Nano Banana Pro model

\#\# Overview

This document describes how to use the Nano Banana Pro model for content generation. The process consists of two steps:  
1\. Create a generation task  
2\. Query task status and results

\#\# Authentication

All API requests require a Bearer Token in the request header:

\`\`\`  
Authorization: Bearer YOUR\_API\_KEY  
\`\`\`

Get API Key:  
1\. Visit \[API Key Management Page\](https://kie.ai/api-key) to get your API Key  
2\. Add to request header: \`Authorization: Bearer YOUR\_API\_KEY\`

\---

\#\# 1\. Create Generation Task

\#\#\# API Information  
\- \*\*URL\*\*: \`POST https://api.kie.ai/api/v1/jobs/createTask\`  
\- \*\*Content-Type\*\*: \`application/json\`

\#\#\# Request Parameters

| Parameter | Type | Required | Description |  
|-----------|------|----------|-------------|  
| model | string | Yes | Model name, format: \`nano-banana-pro\` |  
| input | object | Yes | Input parameters object |  
| callBackUrl | string | No | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or fail). If not provided, no callback notifications will be sent. Example: \`"https://your-domain.com/api/callback"\` |

\#\#\# Model Parameter

The \`model\` parameter specifies which AI model to use for content generation.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Format\*\* | \`nano-banana-pro\` | The exact model identifier for this API |  
| \*\*Type\*\* | string | Must be passed as a string value |  
| \*\*Required\*\* | Yes | This parameter is mandatory for all requests |

\> \*\*Note\*\*: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

\#\#\# Callback URL Parameter

The \`callBackUrl\` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Purpose\*\* | Task completion notification | Receive real-time updates when your task finishes |  
| \*\*Method\*\* | POST request | The system sends POST requests to your callback URL |  
| \*\*Timing\*\* | When task completes | Notifications sent for both success and failure states |  
| \*\*Content\*\* | Query Task API response | Callback content structure is identical to the Query Task API response |  
| \*\*Parameters\*\* | Complete request data | The \`param\` field contains the complete Create Task request parameters, not just the input section |  
| \*\*Optional\*\* | Yes | If not provided, no callback notifications will be sent |

\*\*Important Notes:\*\*  
\- The callback content structure is identical to the Query Task API response  
\- The \`param\` field contains the complete Create Task request parameters, not just the input section    
\- If \`callBackUrl\` is not provided, no callback notifications will be sent

\#\#\# input Object Parameters

\#\#\#\# prompt  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: A text description of the image you want to generate  
\- \*\*Max Length\*\*: 20000 characters  
\- \*\*Default Value\*\*: \`"Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1\) 4K mountain landscape, 2\) banana holds page of long multilingual text with auto translation, 3\) Gemini 3 hologram for search/knowledge/reasoning, 4\) camera UI sliders for angle focus color, 5\) frame trio 1:1-9:16, 6\) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI."\`

\#\#\#\# image\_input  
\- \*\*Type\*\*: \`array\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Please provide the URL of the uploaded file,Input images to transform or use as reference (supports up to 8 images)  
\- \*\*Max File Size\*\*: 30MB  
\- \*\*Accepted File Types\*\*: image/jpeg, image/png, image/webp  
\- \*\*Multiple Files\*\*: Yes  
\- \*\*Default Value\*\*: \`\[\]\`

\#\#\#\# aspect\_ratio  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Aspect ratio of the generated image  
\- \*\*Options\*\*:  
  \- \`1:1\`: 1:1  
  \- \`2:3\`: 2:3  
  \- \`3:2\`: 3:2  
  \- \`3:4\`: 3:4  
  \- \`4:3\`: 4:3  
  \- \`4:5\`: 4:5  
  \- \`5:4\`: 5:4  
  \- \`9:16\`: 9:16  
  \- \`16:9\`: 16:9  
  \- \`21:9\`: 21:9  
  \- \`auto\`: Auto  
\- \*\*Default Value\*\*: \`"1:1"\`

\#\#\#\# resolution  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Resolution of the generated image  
\- \*\*Options\*\*:  
  \- \`1K\`: 1K  
  \- \`2K\`: 2K  
  \- \`4K\`: 4K  
\- \*\*Default Value\*\*: \`"1K"\`

\#\#\#\# output\_format  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: Format of the output image  
\- \*\*Options\*\*:  
  \- \`png\`: PNG  
  \- \`jpg\`: JPG  
\- \*\*Default Value\*\*: \`"png"\`

\#\#\# Request Example

\`\`\`json  
{  
  "model": "nano-banana-pro",  
  "input": {  
    "prompt": "Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1\) 4K mountain landscape, 2\) banana holds page of long multilingual text with auto translation, 3\) Gemini 3 hologram for search/knowledge/reasoning, 4\) camera UI sliders for angle focus color, 5\) frame trio 1:1-9:16, 6\) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI.",  
    "image\_input": \[\],  
    "aspect\_ratio": "1:1",  
    "resolution": "1K",  
    "output\_format": "png"  
  }  
}  
\`\`\`  
\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9"  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID for querying task status |

\---

\#\# 2\. Query Task Status

\#\#\# API Information  
\- \*\*URL\*\*: \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
\- \*\*Parameter\*\*: \`taskId\` (passed via URL parameter)

\#\#\# Request Example  
\`\`\`  
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9  
\`\`\`

\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9",  
    "model": "nano-banana-pro",  
    "state": "waiting",  
    "param": "{\\"model\\":\\"nano-banana-pro\\",\\"input\\":{\\"prompt\\":\\"Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1\) 4K mountain landscape, 2\) banana holds page of long multilingual text with auto translation, 3\) Gemini 3 hologram for search/knowledge/reasoning, 4\) camera UI sliders for angle focus color, 5\) frame trio 1:1-9:16, 6\) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI.\\",\\"image\_input\\":\[\],\\"aspect\_ratio\\":\\"1:1\\",\\"resolution\\":\\"1K\\",\\"output\_format\\":\\"png\\"}}",  
    "resultJson": "{\\"resultUrls\\":\[\\"https://static.aiquickdraw.com/tools/example/1763662100739\_DlBXJvdR.png\\"\]}",  
    "failCode": null,  
    "failMsg": null,  
    "costTime": null,  
    "completeTime": null,  
    "createTime": 1757584164490  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID |  
| data.model | string | Model name used |  
| data.state | string | Task status: \`waiting\`(waiting),  \`success\`(success), \`fail\`(fail) |  
| data.param | string | Task parameters (JSON string) |  
| data.resultJson | string | Task result (JSON string, available when task is success). Structure depends on outputMediaType: \`{resultUrls: \[\]}\` for image/media/video, \`{resultObject: {}}\` for text |  
| data.failCode | string | Failure code (available when task fails) |  
| data.failMsg | string | Failure message (available when task fails) |  
| data.costTime | integer | Task duration in milliseconds (available when task is success) |  
| data.completeTime | integer | Completion timestamp (available when task is success) |  
| data.createTime | integer | Creation timestamp |

\---

\#\# Usage Flow

1\. \*\*Create Task\*\*: Call \`POST https://api.kie.ai/api/v1/jobs/createTask\` to create a generation task  
2\. \*\*Get Task ID\*\*: Extract \`taskId\` from the response  
3\. \*\*Wait for Results\*\*:   
   \- If you provided a \`callBackUrl\`, wait for the callback notification  
   \- If no \`callBackUrl\`, poll status by calling \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
4\. \*\*Get Results\*\*: When \`state\` is \`success\`, extract generation results from \`resultJson\`

\#\# Error Codes

| Status Code | Description |  
|-------------|-------------|  
| 200 | Request successful |  
| 400 | Invalid request parameters |  
| 401 | Authentication failed, please check API Key |  
| 402 | Insufficient account balance |  
| 404 | Resource not found |  
| 422 | Parameter validation failed |  
| 429 | Request rate limit exceeded |  
| 500 | Internal server error |

# \# Motion Control API Documentation

\# Motion Control API Documentation

\> Generate content using the Motion Control model

\#\# Overview

This document describes how to use the Motion Control model for content generation. The process consists of two steps:  
1\. Create a generation task  
2\. Query task status and results

\#\# Authentication

All API requests require a Bearer Token in the request header:

\`\`\`  
Authorization: Bearer YOUR\_API\_KEY  
\`\`\`

Get API Key:  
1\. Visit \[API Key Management Page\](https://kie.ai/api-key) to get your API Key  
2\. Add to request header: \`Authorization: Bearer YOUR\_API\_KEY\`

\---

\#\# 1\. Create Generation Task

\#\#\# API Information  
\- \*\*URL\*\*: \`POST https://api.kie.ai/api/v1/jobs/createTask\`  
\- \*\*Content-Type\*\*: \`application/json\`

\#\#\# Request Parameters

| Parameter | Type | Required | Description |  
|-----------|------|----------|-------------|  
| model | string | Yes | Model name, format: \`kling-2.6/motion-control\` |  
| input | object | Yes | Input parameters object |  
| callBackUrl | string | No | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or fail). If not provided, no callback notifications will be sent. Example: \`"https://your-domain.com/api/callback"\` |

\#\#\# Model Parameter

The \`model\` parameter specifies which AI model to use for content generation.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Format\*\* | \`kling-2.6/motion-control\` | The exact model identifier for this API |  
| \*\*Type\*\* | string | Must be passed as a string value |  
| \*\*Required\*\* | Yes | This parameter is mandatory for all requests |

\> \*\*Note\*\*: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

\#\#\# Callback URL Parameter

The \`callBackUrl\` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |  
|----------|-------|-------------|  
| \*\*Purpose\*\* | Task completion notification | Receive real-time updates when your task finishes |  
| \*\*Method\*\* | POST request | The system sends POST requests to your callback URL |  
| \*\*Timing\*\* | When task completes | Notifications sent for both success and failure states |  
| \*\*Content\*\* | Query Task API response | Callback content structure is identical to the Query Task API response |  
| \*\*Parameters\*\* | Complete request data | The \`param\` field contains the complete Create Task request parameters, not just the input section |  
| \*\*Optional\*\* | Yes | If not provided, no callback notifications will be sent |

\*\*Important Notes:\*\*  
\- The callback content structure is identical to the Query Task API response  
\- The \`param\` field contains the complete Create Task request parameters, not just the input section    
\- If \`callBackUrl\` is not provided, no callback notifications will be sent

\#\#\# input Object Parameters

\#\#\#\# prompt  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: No  
\- \*\*Description\*\*: A text description of the desired output. Maximum length is 2500 characters.  
\- \*\*Max Length\*\*: 2500 characters  
\- \*\*Default Value\*\*: \`"The cartoon character is dancing."\`

\#\#\#\# input\_urls  
\- \*\*Type\*\*: \`array\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: Please provide the URL of the uploaded file,Reference image. The characters, backgrounds, and other elements in the generated video are based on the reference image. Supports .jpg/.jpeg/.png, max 10MB, size needs to be greater than 300px, aspect ratio 2:5 to 5:2.  
\- \*\*Max File Size\*\*: 10MB  
\- \*\*Accepted File Types\*\*: image/jpeg, image/png, image/jpg  
\- \*\*Multiple Files\*\*: Yes  
\- \*\*Default Value\*\*: \`\["https://static.aiquickdraw.com/tools/example/1767694885407\_pObJoMcy.png"\]\`

\#\#\#\# video\_urls  
\- \*\*Type\*\*: \`array\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: Please provide the URL of the uploaded file,Reference video. The character actions in the generated video are consistent with the reference video. Supports .mp4/.mov, max 100MB, 3-30 seconds duration depending on character\_orientation.  
\- \*\*Max File Size\*\*: 100MB  
\- \*\*Accepted File Types\*\*: video/mp4, video/quicktime, video/x-matroska  
\- \*\*Multiple Files\*\*: Yes  
\- \*\*Default Value\*\*: \`\["https://static.aiquickdraw.com/tools/example/1767525918769\_QyvTNib2.mp4"\]\`

\#\#\#\# character\_orientation  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: Generate the orientation of the characters in the video. 'image': same orientation as the person in the picture (max 10s video). 'video': consistent with the orientation of the characters in the video (max 30s video).  
\- \*\*Options\*\*:  
  \- \`image\`: Image  
  \- \`video\`: Video  
\- \*\*Default Value\*\*: \`"video"\`

\#\#\#\# mode  
\- \*\*Type\*\*: \`string\`  
\- \*\*Required\*\*: Yes  
\- \*\*Description\*\*: Output resolution mode. Use 'std' for 720p or 'pro' for 1080p.  
\- \*\*Options\*\*:  
  \- \`720p\`: 720p  
  \- \`1080p\`: 1080p  
\- \*\*Default Value\*\*: \`"720p"\`

\#\#\# Request Example

\`\`\`json  
{  
  "model": "kling-2.6/motion-control",  
  "input": {  
    "prompt": "The cartoon character is dancing.",  
    "input\_urls": \["https://static.aiquickdraw.com/tools/example/1767694885407\_pObJoMcy.png"\],  
    "video\_urls": \["https://static.aiquickdraw.com/tools/example/1767525918769\_QyvTNib2.mp4"\],  
    "character\_orientation": "video",  
    "mode": "720p"  
  }  
}  
\`\`\`  
\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9"  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID for querying task status |

\---

\#\# 2\. Query Task Status

\#\#\# API Information  
\- \*\*URL\*\*: \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
\- \*\*Parameter\*\*: \`taskId\` (passed via URL parameter)

\#\#\# Request Example  
\`\`\`  
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9  
\`\`\`

\#\#\# Response Example

\`\`\`json  
{  
  "code": 200,  
  "msg": "success",  
  "data": {  
    "taskId": "281e5b0\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*f39b9",  
    "model": "kling-2.6/motion-control",  
    "state": "waiting",  
    "param": "{\\"model\\":\\"kling-2.6/motion-control\\",\\"input\\":{\\"prompt\\":\\"The cartoon character is dancing.\\",\\"input\_urls\\":\[\\"https://static.aiquickdraw.com/tools/example/1767694885407\_pObJoMcy.png\\"\],\\"video\_urls\\":\[\\"https://static.aiquickdraw.com/tools/example/1767525918769\_QyvTNib2.mp4\\"\],\\"character\_orientation\\":\\"video\\",\\"mode\\":\\"720p\\"}}",  
    "resultJson": "{\\"resultUrls\\":\[\\"https://static.aiquickdraw.com/tools/example/1767525938144\_1MAbktBM.mp4\\"\]}",  
    "failCode": null,  
    "failMsg": null,  
    "costTime": null,  
    "completeTime": null,  
    "createTime": 1757584164490  
  }  
}  
\`\`\`

\#\#\# Response Parameters

| Parameter | Type | Description |  
|-----------|------|-------------|  
| code | integer | Response status code, 200 indicates success |  
| msg | string | Response message |  
| data.taskId | string | Task ID |  
| data.model | string | Model name used |  
| data.state | string | Task status: \`waiting\`(waiting),  \`success\`(success), \`fail\`(fail) |  
| data.param | string | Task parameters (JSON string) |  
| data.resultJson | string | Task result (JSON string, available when task is success). Structure depends on outputMediaType: \`{resultUrls: \[\]}\` for image/media/video, \`{resultObject: {}}\` for text |  
| data.failCode | string | Failure code (available when task fails) |  
| data.failMsg | string | Failure message (available when task fails) |  
| data.costTime | integer | Task duration in milliseconds (available when task is success) |  
| data.completeTime | integer | Completion timestamp (available when task is success) |  
| data.createTime | integer | Creation timestamp |

\---

\#\# Usage Flow

1\. \*\*Create Task\*\*: Call \`POST https://api.kie.ai/api/v1/jobs/createTask\` to create a generation task  
2\. \*\*Get Task ID\*\*: Extract \`taskId\` from the response  
3\. \*\*Wait for Results\*\*:   
   \- If you provided a \`callBackUrl\`, wait for the callback notification  
   \- If no \`callBackUrl\`, poll status by calling \`GET https://api.kie.ai/api/v1/jobs/recordInfo\`  
4\. \*\*Get Results\*\*: When \`state\` is \`success\`, extract generation results from \`resultJson\`

\#\# Error Codes

| Status Code | Description |  
|-------------|-------------|  
| 200 | Request successful |  
| 400 | Invalid request parameters |  
| 401 | Authentication failed, please check API Key |  
| 402 | Insufficient account balance |  
| 404 | Resource not found |  
| 422 | Parameter validation failed |  
| 429 | Request rate limit exceeded |  
| 500 | Internal server error |

