Flux Schnell API (Free) Documentation
Get Image - Request Code
HTTP
Python
JavaScript
cURL
Java
PHP
POST https://gateway.pixazo.ai/flux-1-schnell/v1/getData HTTP/1.1
Host: gateway.pixazo.ai
Content-Type: application/json
Cache-Control: no-cache
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY

{
  "prompt": "Picture a sleek, futuristic car racing through a neon-lit cityscape, its engine humming efficiently as it blurs past digital billboards. The driver skillfully navigates the glowing streets, aiming for victory in this high-tech, adrenaline-fueled race of tomorrow.",
  "num_steps": 4,
  "seed": 15,
  "height": 512,
  "width": 512
}
Output
Successful API response:

{
  "output": "<IMAGE_URL>"
}
Request Body - Get Image
Parameters for /getData:

Parameter	Required	Type	Description
prompt	Yes	string	The text query that instructs the AI model on what kind of content to generate.
num_steps	No	integer	The number of diffusion steps; higher values can improve quality but take longer. Default: 4, Maximum: 8
seed	No	integer	A "seed" is used to generate a consistent sequence of pseudo-random numbers, aiding reproducibility.
height	No	integer	The desired height of the generated image, specified in pixels. Default: 1024
width	No	integer	The desired width of the generated image, specified in pixels. Default: 1024
Example Request - Get Image
JSON
{
  "prompt": "Picture a sleek, futuristic car racing through a neon-lit cityscape, its engine humming efficiently as it blurs past digital billboards. The driver skillfully navigates the glowing streets, aiming for victory in this high-tech, adrenaline-fueled race of tomorrow.",
  "num_steps": 4,
  "seed": 15,
  "height": 512,
  "width": 512
}
Response - Get Image
JSON
{
  "output": "https://images.pixazo.ai/generated/abc123.jpg"
}
Request Headers
Header	Description
Content-Type	application/json
Cache-Control	no-cache
Ocp-Apim-Subscription-Key	Your subscription key for authentication
Response Handling
The flux-1 Schnell returns specific HTTP status codes and response bodies to indicate the success or failure of a request. Developers should implement error handling in their applications to manage these responses effectively.

Common Status Codes and Responses
Status Code	Description	Response Body
200	Success - The request was successfully processed.	{ "success": true, ... }
400	Bad Request - The request contains invalid parameters or missing fields.	{ "error": "Invalid request parameters" }
401	Unauthorized - The provided subscription key is missing or invalid.	{ "error": "Invalid or missing authentication" }
403	Forbidden - The subscription does not have access to this API or action.	{ "error": "Access denied for this operation" }
404	Not Found - The requested resource or endpoint could not be found.	{ "error": "Endpoint not found" }
429	Too Many Requests - The request rate limit has been exceeded.	{ "error": "Rate limit exceeded, please retry later" }
500	Internal Server Error - An unexpected error occurred on the server.	{ "error": "An unexpected error occurred, please try again later" }
Example Error Response
{
  "error": "Invalid parameters"
}