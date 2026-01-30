Stable Diffusion Inpainting API Documentation
Get Image - Request Code
HTTPPythonJavaScriptcURLJavaPHP
const url = 'https://gateway-stable-diffusion-v1-5-inpainting.appypie.workers.dev/getImage'; const headers = { 'Ocp-Apim-Subscription-Key': 'your-subscription-key-here', 'Content-Type': 'application/json' }; const data = { prompt: 'Change to a lion', imageUrl: 'https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png', maskUrl: 'https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog-mask.png', negative_prompt: 'watermark', height: 1024, width: 1024, num_steps: 20, guidance: 5, seed: 42 }; fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) }) .then(response => response.json()) .then(data => console.log(data)) .catch(error => console.error('Error:', error));
Output
Successful API response:
{ "imageUrl": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/sdxl_lightning/prompt-355182775-1724841428119-422172.png" }
Request Body - Get Image
Parameters for /getImage:
Parameter
Required
Type
Description
Prompt
Yes
String
The main instruction for the image transformation ("Change to a lion").
imageUrl
No
URL
The URL of the initial image to be transformed ([Link](https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png)).
maskUrl
No
URL
The URL of the mask image ([Link](https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog-mask.png)).
Negative Prompt
No
String
A prompt to specify what should be avoided in the image ("watermark").
Height
No
Integer
The height of the output image (1024).
Width
No
Integer
The width of the output image (1024).
Num Steps
No
Integer
The number of steps for the transformation process (20).
Guidance
No
Integer
The guidance scale for the transformation (5).
Seed
No
Integer
The seed value for random number generation to ensure reproducibility (42).

Example Request - Get Image
JSON
{ "prompt": "Change to a lion", "imageUrl": "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png", "maskUrl": "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog-mask.png", "negative_prompt": "watermark", "height": 1024, "width": 1024, "num_steps": 20, "guidance": 5, "seed": 42 }
Response - Get Image
JSON
{ "imageUrl": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/sdxl_lightning/prompt-355182775-1724841428119-422172.png" }
Request Headers
Header
Description
Ocp-Apim-Subscription-Key
Subscription key for authentication.
Content-Type
Must be set to application/json.

Response Handling
The Stable Diffusion-v1-5 Inpainting returns specific HTTP status codes and response bodies to indicate the success or failure of a request. Developers should implement error handling in their applications to manage these responses effectively.
Common Status Codes and Responses
Status Code
Description
Response Body
200
Success - The request was successfully processed.
{ "success": true, ... }
400
Bad Request - The request contains invalid parameters or missing fields.
{ "error": "Invalid request parameters" }
401
Unauthorized - The provided subscription key is missing or invalid.
{ "error": "Invalid or missing authentication" }
403
Forbidden - The subscription does not have access to this API or action.
{ "error": "Access denied for this operation" }
404
Not Found - The requested resource or endpoint could not be found.
{ "error": "Endpoint not found" }
429
Too Many Requests - The request rate limit has been exceeded.
{ "error": "Rate limit exceeded, please retry later" }
500
Internal Server Error - An unexpected error occurred on the server.
{ "error": "An unexpected error occurred, please try again later" }

Example Error Response
{ "error": "Invalid parameters" }
Retrieving Image Result and URL
After submitting your request, use this endpoint to check status and retrieve results.
Endpoint
POST https://gateway.pixazo.ai/ai-model-api-polling/getGenerationResults
Request Body
{ "job_set_id": "your-job-set-id-here" }
Example Request
JSON
{ "job_set_id": "jobset_abc123xyz" }
Example Response
JSON
{ "status": "succeeded", "results": [ { "imageUrl": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/sdxl_lightning/prompt-355182775-1724841428119-422172.png", "job_id": "job_123" } ], "job_set_id": "jobset_abc123xyz" }
Code Examples
HTTPPythonJavaScriptcURLJavaPHP
const url = 'https://gateway.pixazo.ai/ai-model-api-polling/getGenerationResults'; const headers = { 'Ocp-Apim-Subscription-Key': 'your-subscription-key-here', 'Content-Type': 'application/json' }; const data = { job_set_id: 'jobset_abc123xyz' }; fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) }) .then(response => response.json()) .then(data => console.log(data)) .catch(error => console.error('Error:', error));

