Stable Diffusion API (Free) Documentation
Get Image - Request Code
HTTPPythonJavaScriptcURLJavaPHP

// Request body
const body = {
    "prompt": "High-resolution, realistic image of a sparrow bird perched on a blooming cherry blossom branch during springtime. The sparrow's feathers should be finely detailed with natural colors, including shades of brown and white. The background should be soft-focused with a clear blue sky, creating a serene and peaceful atmosphere.",
    "negative_prompt": "Low-quality, blurry image, with any other birds or animals. Avoid abstract or cartoonish styles, dark or gloomy atmosphere, unnecessary objects or distractions in the background, harsh lighting, and unnatural colors.",
    "height": 1024,
    "width": 1024,
    "num_steps": 20,
    "guidance_scale": 5,
    "seed": 40
};

fetch('https://gateway.pixazo.ai/getImage/v1/getSDXLImage', {
        method: 'POST',
        body: JSON.stringify(body),
        // Request headers
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Ocp-Apim-Subscription-Key': 'XXXXXXXXXXXXXXXXXXXXX',}
    })
    .then(response => {
        console.log(response.status);
        console.log(response.text());
    })
    .catch(err => console.error(err));
         
Output
Successful API response:
{ "imageUrl": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/sdxl_lightning/prompt-355182775-1724841428119-422172.png" }
Request Body - Get Image
Parameters for /getSDXLImage:
Parameter
Required
Type
Description
Prompt
Yes
String
The main instruction for the image transformation ("High-resolution, realistic image of a sparrow bird perched on a blooming cherry blossom branch during springtime. The sparrow's feathers should be finely detailed with natural colors, including shades of brown and white. The background should be soft-focused with a clear blue sky, creating a serene and peaceful atmosphere.")
Negative Prompt
No
String
A prompt to specify what should be avoided in the image ("Low-quality, blurry image, with any other birds or animals. Avoid abstract or cartoonish styles, dark or gloomy atmosphere, unnecessary objects or distractions in the background, harsh lighting, and unnatural colors.")
Height
No
Integer
The height of the output image (1024)
Width
No
Integer
The width of the output image (1024)
Num Steps
No
Integer
The number of steps for the transformation process (20)
Guidance
No
Integer
The guidance scale for the transformation (5)
Seed
No
Integer
The seed value for random number generation to ensure reproducibility (42)

Example Request - Get Image
JSON
{
  "prompt": "High-resolution, realistic image of a sparrow bird perched on a blooming cherry blossom branch during springtime. The sparrow's feathers should be finely detailed with natural colors, including shades of brown and white. The background should be soft-focused with a clear blue sky, creating a serene and peaceful atmosphere.",
  "negative_prompt": "Low-quality, blurry image, with any other birds or animals. Avoid abstract or cartoonish styles, dark or gloomy atmosphere, unnecessary objects or distractions in the background, harsh lighting, and unnatural colors.",
  "height": 1024,
  "width": 1024,
  "num_steps": 20,
  "guidance_scale": 5,
  "seed": 40
}
Response - Get Image
JSON
{
  "imageUrl": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/sdxl_lightning/prompt-355182775-1724841428119-422172.png"
}
Request Headers
Header
Description
Ocp-Apim-Subscription-Key
API subscription key for authentication
Content-Type
Must be set to application/json

Response Handling
The Stable Diffusion XL Base 1.0 returns specific HTTP status codes and response bodies to indicate the success or failure of a request. Developers should implement error handling in their applications to manage these responses effectively.
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
{
  "error": "Invalid parameters"
}

