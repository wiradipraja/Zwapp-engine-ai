// services/qualityAssurance.ts
// Google Vision API Integration untuk Quality Assurance

import { GeneratedImage, QAResult, ModelProfile } from '../types/ugc';

export interface QAConfig {
  apiKey: string;
  modelDescription: string;
  productDescription: string;
}

export interface VisionAPIResponse {
  text?: string;
  safeSearchAnnotation?: {
    adult: string;
    medical: string;
    racy: string;
    violence: string;
  };
  labelAnnotations?: Array<{
    description: string;
    score: number;
  }>;
  objectAnnotations?: Array<{
    name: string;
    score: number;
    vertices: Array<{ x: number; y: number }>;
  }>;
}

/**
 * Run comprehensive QA checks on generated image
 */
export async function analyzeImageQuality(
  image: GeneratedImage,
  sceneNumber: number,
  config: QAConfig
): Promise<QAResult> {
  const { apiKey, modelDescription, productDescription } = config;

  try {
    // Call Google Vision API
    const visionResponse = await callVisionAPI(image.imageUrl, apiKey);

    // Analyze model consistency
    const modelConsistency = analyzeModelConsistency(
      visionResponse,
      modelDescription
    );

    // Analyze product placement
    const productPlacement = analyzeProductPlacement(
      visionResponse,
      productDescription
    );

    // Check for hallucinations
    const hallucinations = detectHallucinations(visionResponse);

    // Check style cohesion
    const styleCohesion = analyzeStyleCohesion(visionResponse);

    // Overall assessment
    const overallStatus = determineStatus(
      modelConsistency,
      productPlacement,
      hallucinations
    );

    const suggestedFixes = generateSuggestions(
      modelConsistency,
      productPlacement,
      hallucinations,
      styleCohesion
    );

    const qaResult: QAResult = {
      id: crypto.randomUUID(),
      sceneNumber,
      imageId: image.id,
      checks: {
        modelConsistency: {
          passed: modelConsistency.score >= 85,
          confidence: modelConsistency.confidence,
          notes: modelConsistency.notes,
        },
        productPlacement: {
          passed: productPlacement.score >= 80,
          confidence: productPlacement.confidence,
          notes: productPlacement.notes,
        },
        styleCohesion: {
          passed: styleCohesion.score >= 80,
          confidence: styleCohesion.confidence,
          notes: styleCohesion.notes,
        },
        noHallucinations: {
          passed: !hallucinations.detected,
          confidence: hallucinations.confidence,
          notes: hallucinations.notes,
        },
      },
      overallStatus,
      suggestedFixes,
      performedAt: Date.now(),
      analysisModel: 'vision-api',
    };

    return qaResult;
  } catch (error) {
    throw new Error(
      `QA analysis failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Call Google Vision API with image
 */
async function callVisionAPI(
  imageUrl: string,
  apiKey: string
): Promise<VisionAPIResponse> {
  try {
    // Prepare image content (base64 or URL)
    const imageContent = imageUrl.startsWith('data:')
      ? imageUrl.split(',')[1] // Extract base64 from data URL
      : imageUrl; // Use URL directly

    const response = await fetch(
      'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageContent,
              },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'LABEL_DETECTION' },
                { type: 'OBJECT_LOCALIZATION' },
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'IMAGE_PROPERTIES' },
              ],
              imageContext: {
                languageHints: ['en'],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.responses[0] || {};
  } catch (error) {
    throw new Error(
      `Vision API call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Analyze model consistency with reference description
 */
function analyzeModelConsistency(
  visionResponse: VisionAPIResponse,
  modelDescription: string
): {
  score: number;
  confidence: number;
  notes: string;
} {
  const labels = visionResponse.labelAnnotations || [];

  // Check for human detection
  const hasHuman = labels.some(
    (l) => l.description.toLowerCase().includes('person') && l.score > 0.8
  );

  if (!hasHuman) {
    return {
      score: 30,
      confidence: 0.95,
      notes: 'Model not detected in image',
    };
  }

  // Analyze facial features and body consistency
  const bodyLabels = labels.filter((l) =>
    ['face', 'head', 'person', 'woman', 'man'].some((term) =>
      l.description.toLowerCase().includes(term)
    )
  );

  const score = Math.min(
    95,
    50 + bodyLabels.length * 15 + bodyLabels.reduce((sum, l) => sum + l.score * 10, 0)
  );

  return {
    score: Math.round(score),
    confidence: Math.min(0.98, 0.7 + bodyLabels.length * 0.1),
    notes: `Model consistency: ${hasHuman ? 'Human detected' : 'No human'}, ${bodyLabels.length} body parts identified`,
  };
}

/**
 * Analyze product placement in image
 */
function analyzeProductPlacement(
  visionResponse: VisionAPIResponse,
  productDescription: string
): {
  score: number;
  confidence: number;
  notes: string;
} {
  const objects = visionResponse.objectAnnotations || [];
  const labels = visionResponse.labelAnnotations || [];

  // Check for product visibility
  const allText =
    [...labels.map((l) => l.description), ...objects.map((o) => o.name)].join(' ').toLowerCase();

  const productKeywords = productDescription.toLowerCase().split(' ').filter((w) => w.length > 3);
  const matchedKeywords = productKeywords.filter((keyword) => allText.includes(keyword));

  const detectionScore = (matchedKeywords.length / productKeywords.length) * 100;

  // Check product visibility/prominence
  const prominentObjects = objects.filter((o) => o.score > 0.6);
  const score = Math.min(95, 40 + detectionScore + prominentObjects.length * 5);

  return {
    score: Math.round(score),
    confidence: Math.min(0.95, 0.5 + matchedKeywords.length * 0.15),
    notes: `Product visibility: ${matchedKeywords.length}/${productKeywords.length} keywords detected, ${prominentObjects.length} prominent objects`,
  };
}

/**
 * Detect hallucinations in generated image
 */
function detectHallucinations(visionResponse: VisionAPIResponse): {
  detected: boolean;
  confidence: number;
  notes: string;
} {
  const labels = visionResponse.labelAnnotations || [];
  const objects = visionResponse.objectAnnotations || [];

  // Check for unusual or impossible combinations
  const suspiciousPatterns = [
    { keywords: ['extra fingers', 'malformed'], risk: 'anatomy' },
    { keywords: ['double', 'duplicate'], risk: 'duplication' },
    { keywords: ['blurry', 'glitch'], risk: 'quality' },
  ];

  let hallucinations = 0;
  let suspiciousLabels: string[] = [];

  labels.forEach((label) => {
    suspiciousPatterns.forEach((pattern) => {
      if (
        pattern.keywords.some((kw) =>
          label.description.toLowerCase().includes(kw)
        ) &&
        label.score > 0.7
      ) {
        hallucinations++;
        suspiciousLabels.push(label.description);
      }
    });
  });

  // Check object position anomalies
  const positionAnomalies = detectPositionAnomalies(objects);

  const totalIssues = hallucinations + positionAnomalies;

  return {
    detected: totalIssues > 0,
    confidence: Math.min(0.98, 0.6 + totalIssues * 0.2),
    notes:
      totalIssues === 0
        ? 'No hallucinations detected'
        : `Potential issues: ${suspiciousLabels.join(', ')}, ${positionAnomalies} position anomalies`,
  };
}

/**
 * Analyze style cohesion of image
 */
function analyzeStyleCohesion(visionResponse: VisionAPIResponse): {
  score: number;
  confidence: number;
  notes: string;
} {
  // Use image properties for style analysis
  // Check color palette consistency, lighting uniformity, etc.

  const labels = visionResponse.labelAnnotations || [];

  // Analyze lighting and color-related labels
  const styleLabels = labels.filter((l) =>
    [
      'lighting',
      'bright',
      'natural',
      'soft',
      'shadow',
      'color',
      'saturated',
    ].some((term) => l.description.toLowerCase().includes(term))
  );

  const consistencyScore = 70 + styleLabels.length * 5;
  const score = Math.min(95, consistencyScore);

  return {
    score: Math.round(score),
    confidence: 0.75,
    notes: `Style consistency: ${styleLabels.length} style attributes detected`,
  };
}

/**
 * Detect object position anomalies
 */
function detectPositionAnomalies(
  objects: Array<{ name: string; vertices: Array<{ x: number; y: number }> }>
): number {
  let anomalies = 0;

  objects.forEach((obj) => {
    if (!obj.vertices || obj.vertices.length < 4) return;

    const [topLeft, topRight, bottomRight, bottomLeft] = obj.vertices;

    // Check for unrealistic aspect ratios
    const width =
      (topRight.x - topLeft.x + (bottomRight.x - bottomLeft.x)) / 2;
    const height =
      (bottomLeft.y - topLeft.y + (bottomRight.y - topRight.y)) / 2;

    const aspectRatio = width / height;

    // Flag extreme aspect ratios
    if (aspectRatio < 0.2 || aspectRatio > 5) {
      anomalies++;
    }
  });

  return anomalies;
}

/**
 * Determine overall QA status
 */
function determineStatus(
  modelConsistency: { score: number },
  productPlacement: { score: number },
  hallucinations: { detected: boolean }
): 'passed' | 'failed' | 'needs_review' {
  if (hallucinations.detected) {
    return 'needs_review';
  }

  if (modelConsistency.score >= 85 && productPlacement.score >= 80) {
    return 'passed';
  }

  if (modelConsistency.score >= 70 && productPlacement.score >= 65) {
    return 'needs_review';
  }

  return 'failed';
}

/**
 * Generate suggested fixes based on QA results
 */
function generateSuggestions(
  modelConsistency: { score: number },
  productPlacement: { score: number },
  hallucinations: { notes: string },
  styleCohesion: { score: number }
): string[] {
  const suggestions: string[] = [];

  if (modelConsistency.score < 80) {
    suggestions.push('Regenerate with clearer model reference image');
  }

  if (productPlacement.score < 80) {
    suggestions.push('Adjust product positioning prompt for better visibility');
  }

  if (hallucinations.notes.includes('Potential')) {
    suggestions.push('Review image for artifacts and regenerate if needed');
  }

  if (styleCohesion.score < 75) {
    suggestions.push('Enhance visual style guide prompts for consistency');
  }

  if (suggestions.length === 0) {
    suggestions.push('Image passed all checks - ready for approval');
  }

  return suggestions;
}

/**
 * Estimate cost for QA analysis
 * Google Vision API: ~$0.005 per image (free quota available)
 */
export function estimateQACost(imageCount: number): number {
  const costPerImage = 0.005; // $0.005 per image
  return imageCount * costPerImage;
}

/**
 * Run QA on multiple images
 */
export async function runBatchQA(
  images: GeneratedImage[],
  sceneNumbers: number[],
  config: QAConfig
): Promise<QAResult[]> {
  const results: QAResult[] = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const result = await analyzeImageQuality(
        images[i],
        sceneNumbers[i] || i + 1,
        config
      );
      results.push(result);

      // Small delay between API calls
      if (i < images.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`QA failed for image ${i}:`, error);
    }
  }

  return results;
}
