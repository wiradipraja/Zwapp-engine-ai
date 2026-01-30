Kling Video v2.6 Motion Control API Documentation
Kling Video v2.6 Standard Motion Control generate request - Request Code
HTTP
Python
JavaScript
cURL
Java
PHP
POST https://gateway.pixazo.ai/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request Content-Type: application/json Cache-Control: no-cache Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY { "image_url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/motion.jpg", "video_url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/motion.mp4", "character_orientation": "video", "keep_original_sound": true }
Output
Successful API response:

{ "status": "IN_QUEUE", "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX", "message": "Motion transfer job queued successfully" }
Request Body - Kling Video v2.6 Standard Motion Control generate request
Parameters for https://gateway.pixazo.ai/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request:

Parameter	Required	Type	Description
image_url	Yes	string	URL pointing to the static character image (JPEG/PNG) to which motion will be transferred. Must be publicly accessible.
video_url	Yes	string	URL pointing to the reference video containing the motion to transfer (MP4). Must be publicly accessible and under 10 seconds.
character_orientation	No	string	Specifies how the character in the image should align with the video motion. Use "video" to match the video's orientation or "image" to match the image's orientation.
keep_original_sound	No	boolean	If true, preserves the audio from the reference video in the output. If false, output will be silent.
Example Request - Kling Video v2.6 Standard Motion Control generate request
JSON
{ "image_url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/motion.jpg", "video_url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/motion.mp4", "character_orientation": "video", "keep_original_sound": true }
Response - Kling Video v2.6 Standard Motion Control generate request
JSON
{ "status": "IN_QUEUE", "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX", "message": "Motion transfer job queued successfully" }
Request Headers
Header	Description
Content-Type	Must be set to application/json
Cache-Control	Must be set to no-cache
Ocp-Apim-Subscription-Key	API subscription key for authentication
Response Handling
The Kling Video v2.6 Standard Motion Control returns specific HTTP status codes and response bodies to indicate the success or failure of a request. Developers should implement error handling in their applications to manage these responses effectively.

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
{ "error": "Invalid parameters" }
Retrieving Results
After submitting your request, use this endpoint to check status and retrieve results.

Endpoint
POST https://gateway.pixazo.ai/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request-result

Request Body
{ "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX" }
Example Polling Request
HTTP
Python
JavaScript
cURL
Java
PHP
POST https://gateway.pixazo.ai/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request-result Content-Type: application/json Cache-Control: no-cache Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY { "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX" }
Response States
Status	Description
IN_QUEUE	Request is queued and waiting for processing.
IN_PROGRESS	The motion transfer is currently being rendered.
COMPLETED	The motion transfer has completed successfully. Results are available in the output_url field.
FAILED	The request failed due to invalid input, resource unavailability, or system error. Check the error_message field for details.
Example Success Response
{ "status": "COMPLETED", "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX", "output_url": "https://storage.pixazo.ai/output/5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX.mp4", "duration_seconds": 4.2, "width": 512, "height": 768, "content_type": "video/mp4", "has_audio": true }
Example In-Progress Response
{ "status": "IN_PROGRESS", "request_id": "5aefcXXX-XXXXX-XXXX-XXXX-XXXXXXXX", "progress_percent": 65, "estimated_remaining_seconds": 18 }